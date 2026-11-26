#!/usr/bin/env python3
"""AfricaFunds governed GitHub write boundary (NOT an autonomous scheduler).

An executor may call publish_one only after reconciling its canonical
task-local claim and activating a real lease. This module NEVER adopts an
old claim, edits the task queue, creates a branch or deploys to S2.

Each repository effect uses GitHub GraphQL updateRefs with an exact beforeOid,
afterOid and force:false. A two-repository sequence is not cross-repo atomic:
an unknown or partial effect always requires reobservation. No git push.
"""
from __future__ import annotations

import base64
from datetime import timezone
from email.utils import parsedate_to_datetime
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "governance"))
from program_claim_lease import digest, fence

from cug_token_preflight import observe as verify_token_scope

PROJECT = "CS-AFRICAFUNDS-001"
OWNER = "Wealthtechinnovations"
OWNER_ID = 94637590
BRANCH = "claude/code-review-improvements-ikvuj"
REPOSITORIES = {"API": ("api_opcv", 895977310),
                "FRONTEND": ("front_end_opcvm", 895972649)}
QUEUE_PATH = ".governance/loop/task-queue.json"
ENFORCED = "FENCED_CAS_ENFORCED"
GRAPHQL = "mutation Update($input: UpdateRefsInput!) { updateRefs(input: $input) { clientMutationId } }"
HEX40 = re.compile(r"[0-9a-f]{40}\Z")


class WriterRefusal(ValueError):
    pass


def require(ok, code):
    if not ok:
        raise WriterRefusal(code)


def validate_sha(value):
    require(isinstance(value, str) and HEX40.fullmatch(value), "INVALID_COMMIT_SHA")
    return value


class GithubHTTP:
    """Short-lived installation token only; no file/registry persistence."""

    def __init__(self, token: str):
        require(isinstance(token, str) and len(token) >= 20, "CUG_TOKEN_MISSING")
        self.__token = token

    def request(self, path, body=None):
        require(path.startswith("/") and not path.startswith("//"), "INVALID_API_PATH")
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = Request("https://api.github.com" + path, data=data,
                          headers={"Authorization": "Bearer " + self.__token,
                                   "Accept": "application/vnd.github+json",
                                   "Content-Type": "application/json",
                                   "X-GitHub-Api-Version": "2022-11-28",
                                   "User-Agent": "AfricaFunds-governed-writer"})
        try:
            with urlopen(request, timeout=20) as response:
                payload = json.load(response)
                date = response.headers.get("Date")
        except HTTPError as error:
            raise WriterRefusal("GITHUB_HTTP_" + str(error.code)) from None
        except (URLError, ValueError):
            raise WriterRefusal("GITHUB_TRANSPORT_UNAVAILABLE") from None
        require(isinstance(payload, dict), "INVALID_GITHUB_RESPONSE")
        require(isinstance(date, str) and date, "GITHUB_DATE_MISSING")
        try:
            utc = parsedate_to_datetime(date).astimezone(timezone.utc).timestamp()
        except (TypeError, ValueError, OverflowError):
            raise WriterRefusal("GITHUB_CLOCK_UNTRUSTED") from None
        require(abs(time.time() - utc) <= 120, "GITHUB_CLOCK_SKEW")
        return payload, date

    def get(self, path):
        return self.request(path)

    def graphql(self, variables):
        payload, _ = self.request("/graphql", {"query": GRAPHQL, "variables": variables})
        return payload


def repo_path(role, suffix=""):
    require(role in REPOSITORIES, "REPOSITORY_ROLE_INVALID")
    return "/repos/" + OWNER + "/" + REPOSITORIES[role][0] + suffix


def remote_heads(client):
    heads = {}
    for role, (_, identity) in REPOSITORIES.items():
        data, _ = client.get(repo_path(role, "/git/ref/heads/" + BRANCH))
        require(data.get("ref") == "refs/heads/" + BRANCH, "REMOTE_REF_DRIFT")
        oid = (data.get("object") or {}).get("sha")
        heads[role] = validate_sha(oid)
    return heads


def queue_at(client, api_sha):
    path = repo_path("API", "/contents/" + QUEUE_PATH + "?ref=" + validate_sha(api_sha))
    response, _ = client.get(path)
    require(response.get("path") == QUEUE_PATH and response.get("encoding") == "base64",
            "QUEUE_AUTHORITY_UNAVAILABLE")
    try:
        queue = json.loads(base64.b64decode(response["content"], validate=False))
    except (ValueError, KeyError, TypeError):
        raise WriterRefusal("QUEUE_DECODE_FAILED") from None
    require(isinstance(queue, dict), "QUEUE_SCHEMA_INVALID")
    return queue


def inspect_candidate(client, role, base, candidate, effects):
    """Require one exact child commit with a complete, bounded diff."""
    require(isinstance(effects, list) and 0 < len(effects) <= 40 and
            len(set(effects)) == len(effects) and
            all(isinstance(p, str) and p and not p.startswith("/") and
                ".." not in p.split("/") and "\\" not in p for p in effects),
            "EFFECTS_INVALID")
    require(validate_sha(candidate) != validate_sha(base), "EMPTY_CANDIDATE")
    info, _ = client.get(repo_path(role, "/commits/" + candidate))
    require([p.get("sha") for p in info.get("parents", [])] == [base],
            "CANDIDATE_NOT_EXACT_CHILD")
    files = info.get("files")
    require(isinstance(files, list) and 0 < len(files) <= 90 and
            all(f.get("status") in ("added", "modified", "removed") for f in files),
            "UNBOUNDED_OR_RENAMED_DIFF")
    require({f.get("filename") for f in files} == set(effects) and len(files) == len(effects),
            "CANDIDATE_DIFF_SCOPE_MISMATCH")
    return True


def checked_repo_id(client, role):
    info, _ = client.get(repo_path(role))
    name, expected = REPOSITORIES[role]
    require(info.get("id") == expected and info.get("full_name") == OWNER + "/" + name
            and (info.get("owner") or {}).get("id") == OWNER_ID
            and info.get("default_branch") == BRANCH,
            "REPOSITORY_IDENTITY_DRIFT")
    node_id = info.get("node_id")
    require(isinstance(node_id, str) and len(node_id) >= 5, "REPOSITORY_NODE_ID_MISSING")
    return node_id


def guarded_authorize(queue, task_id, owner, session, generation, now, heads, role, effects):
    require((queue.get("surface_claims_contract") or {}).get("mode") == ENFORCED and
            (queue["surface_claims_contract"]).get("current_enforcement") == ENFORCED,
            "LIVE_WRITER_ENFORCEMENT_NOT_ACTIVE")
    try:
        return fence(queue, digest(queue), task_id, owner, session, generation,
                     now, heads, heads, [(role, path) for path in effects])
    except ValueError as error:
        # Keep the canonical lease/fencing validator; no shadow lock registry.
        raise WriterRefusal("LEASE_FENCING_DENIED:" + str(error)) from None


def publish_one(client, *, role, expected_heads, candidate, task_id, owner,
                session, generation, effects):
    """One exact-CAS effect, with fail-closed readback and partial recovery.

    Caller must NOT treat a success as a second-repository transaction.
    A lease grant or a model response alone cannot authorize this operation.
    """
    require(set(expected_heads) == set(REPOSITORIES), "EXPECTED_TUPLE_REQUIRED")
    for sha in expected_heads.values():
        validate_sha(sha)
    require(role in REPOSITORIES, "UNKNOWN_REPOSITORY")
    require(isinstance(task_id, str) and task_id.startswith("AF-"), "TASK_ID_INVALID")
    current = remote_heads(client)
    require(current == expected_heads, "HEAD_TUPLE_DRIFT")
    # Verify installation scope with the same temporary token, before any write.
    verify_token_scope(client.get, expected_heads)
    queue = queue_at(client, current["API"])
    checked_repo_id(client, role)
    inspect_candidate(client, role, current[role], candidate, effects)
    # Fresh read and fresh validation immediately before conditional mutation.
    last = remote_heads(client)
    require(last == current, "HEAD_MOVED_BEFORE_CAS")
    guarded_authorize(queue, task_id, owner, session, generation,
                      int(time.time()), last, role, effects)
    inputs = {
        "repositoryId": checked_repo_id(client, role),
        "clientMutationId": str(uuid4()),
        "refUpdates": [{"name": "refs/heads/" + BRANCH,
                        "beforeOid": current[role], "afterOid": candidate,
                        "force": False}],
    }
    try:
        result = client.graphql({"input": inputs})
    except Exception:
        result = {}
    after = remote_heads(client)
    expected = {**current, role: candidate}
    if result.get("errors") or not (result.get("data") or {}).get("updateRefs"):
        return {"status": "UNKNOWN_EFFECT_REOBSERVE", "heads": after,
                "effect_attempted": True, "writer_gate": "FAIL_CLOSED"}
    if after != expected:
        return {"status": "PARTIAL_REOBSERVE", "heads": after,
                "effect_attempted": True, "writer_gate": "FAIL_CLOSED"}
    return {"status": "APPLIED", "heads": after, "effect_attempted": True,
            "writer_gate": "LEASE_FENCED_CAS"}


if __name__ == "__main__":
    # No CLI writer: an explicit governed caller and verifiable task input are
    # required; prevents accidental use from GitHub Actions schedule/push.
    raise SystemExit("NOT_A_STANDALONE_EXECUTOR")
