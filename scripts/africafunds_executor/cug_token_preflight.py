#!/usr/bin/env python3
"""AfricaFunds CUG installation-token preflight. No ref updates or writes.

This is an independent credential admission probe, not a task dispatcher or
writer. It extends, but does not replace, the existing Programme Director and
its canonical task queue. It cannot release the AF-TASK-028 legacy claim.
"""
from __future__ import annotations

import argparse
from datetime import timezone
from email.utils import parsedate_to_datetime
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PROJECT = "CS-AFRICAFUNDS-001"
BRANCH = "claude/code-review-improvements-ikvuj"
OWNER = "Wealthtechinnovations"
OWNER_ID = 94637590
REPOS = {"API": ("api_opcv", 895977310), "FRONTEND": ("front_end_opcvm", 895972649)}
MAX_CLOCK_SKEW_SECONDS = 120


class AdmissionError(ValueError):
    pass


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise AdmissionError(reason)


def exact_heads(api_sha: str, frontend_sha: str) -> dict[str, str]:
    heads = {"API": api_sha, "FRONTEND": frontend_sha}
    require(all(isinstance(s, str) and re.fullmatch(r"[0-9a-f]{40}", s) for s in heads.values()), "INVALID_HEAD_TUPLE")
    return heads


def observe(get, heads: dict[str, str], now=time.time) -> dict:
    """get(path) returns (decoded GitHub JSON, HTTP Date header).

    GET /installation/repositories requires an installation credential;
    a user PAT must not silently pass as the CUG installation token.
    """
    require(set(heads) == set(REPOS), "HEAD_TUPLE_REQUIRED")
    exact_heads(heads["API"], heads["FRONTEND"])
    observed = {}
    samples = 0

    def read(path: str):
        nonlocal samples
        start = now()
        payload, date = get(path)
        end = now()
        require(isinstance(payload, dict), "INVALID_GITHUB_RESPONSE")
        require(isinstance(date, str) and date, "GITHUB_DATE_MISSING")
        server_time = parsedate_to_datetime(date)
        require(server_time.tzinfo is not None, "GITHUB_CLOCK_UNTRUSTED")
        require(start <= end and abs(server_time.astimezone(timezone.utc).timestamp() - (start + end) / 2) <= MAX_CLOCK_SKEW_SECONDS,
                "GITHUB_CLOCK_SKEW")
        samples += 1
        return payload

    installation = read("/installation/repositories?per_page=100")
    repos = installation.get("repositories")
    require(isinstance(repos, list) and installation.get("total_count") == 2 and len(repos) == 2,
            "APP_TOKEN_NOT_LIMITED_TO_TWO_REPOSITORIES")
    expected_ids = {identity for _, identity in REPOS.values()}
    require({r.get("id") for r in repos if isinstance(r, dict)} == expected_ids,
            "APP_TOKEN_REPOSITORY_SET_DRIFT")
    require({r.get("full_name") for r in repos} == {f"{OWNER}/{name}" for name, _ in REPOS.values()},
            "APP_TOKEN_REPOSITORY_NAMES_DRIFT")

    for role, (name, repo_id) in REPOS.items():
        repository = read(f"/repos/{OWNER}/{name}")
        require(repository.get("id") == repo_id and repository.get("full_name") == f"{OWNER}/{name}" and
                repository.get("default_branch") == BRANCH and
                (repository.get("owner") or {}).get("id") == OWNER_ID,
                "APP_TOKEN_REPOSITORY_IDENTITY_DRIFT:" + role)
        # The app token is requested with permission-contents: write.
        require((repository.get("permissions") or {}).get("push") is True,
                "APP_TOKEN_CONTENTS_WRITE_NOT_ATTESTED:" + role)
        ref = read(f"/repos/{OWNER}/{name}/git/ref/heads/{BRANCH}")
        require(ref.get("ref") == f"refs/heads/{BRANCH}" and
                (ref.get("object") or {}).get("type") == "commit", "REMOTE_REF_IDENTITY_DRIFT:" + role)
        observed[role] = (ref.get("object") or {}).get("sha")
    require(observed == heads, "REMOTE_HEAD_TUPLE_DRIFT")
    return {
        "project": PROJECT,
        "mode": "CUG_SCOPED_INSTALLATION_TOKEN_PREFLIGHT_READ_ONLY",
        "token_repository_set": [f"{OWNER}/{REPOS[role][0]}" for role in ("API", "FRONTEND")],
        "repo_ids": {role: REPOS[role][1] for role in REPOS},
        "expected_heads": heads,
        "observed_heads": observed,
        "clock_observations": samples,
        "app_installation_token_scope": "TWO_REPOSITORIES_ATTESTED",
        "contents_write_permission": "ATTESTED_BUT_UNUSED",
        "writer_gate": "CLOSED_UNTIL_LEASE_FENCING_AND_CODER_ATTESTED",
        "github_write_performed": False,
        "production_mutation": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-api-sha", required=True)
    parser.add_argument("--expected-frontend-sha", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    heads = exact_heads(args.expected_api_sha, args.expected_frontend_sha)
    token = os.environ.get("AF_CUG_INSTALLATION_TOKEN", "")
    require(len(token) > 20, "CUG_INSTALLATION_TOKEN_MISSING")

    def get(path: str):
        request = Request("https://api.github.com" + path, headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "AfricaFunds-CUG-admission-read-only",
        })
        try:
            with urlopen(request, timeout=20) as response:
                return json.load(response), response.headers["Date"]
        except HTTPError as error:
            # Never include headers, token, or response body in logs.
            raise AdmissionError(f"GITHUB_AUTHENTICATED_READ_FAILED_HTTP_{error.code}") from None
        except URLError:
            raise AdmissionError("GITHUB_AUTHENTICATED_READ_TRANSPORT_FAILED") from None

    attestation = observe(get, heads)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(attestation, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print("CUG_TOKEN_SCOPE=TWO_REPOSITORIES_ATTESTED")
    print("CUG_WRITER_GATE=CLOSED_UNTIL_LEASE_FENCING_AND_CODER_ATTESTED")


if __name__ == "__main__":
    try:
        main()
    except AdmissionError as error:
        print("CUG_PREFLIGHT_BLOCKED=" + str(error))
        raise SystemExit(1)
