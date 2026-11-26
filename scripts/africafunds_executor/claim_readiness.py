#!/usr/bin/env python3
"""Read-only live gate for AfricaFunds claim/lease writer admission.

Uses the CUG installation token that the existing preflight already obtains.
It checks the ONLY existing task queue; it never creates, adopts, renews,
releases or transfers a claim. Even a structurally valid lease cannot
implicitly certify a coding engine or grant publication authority.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import time

from cug_token_preflight import observe as verify_token_scope
from governed_cas import (
    ENFORCED, GithubHTTP, QUEUE_PATH, WriterRefusal, queue_at, remote_heads,
)
from program_claim_lease import lease_of

TASK = "AF-TASK-028"


def assess(queue, now):
    tasks = queue.get("tasks", [])
    task = next((t for t in tasks if isinstance(t, dict) and t.get("id") == TASK), None)
    if task is None:
        return "BLOCKED_TASK_MISSING"
    claim = task.get("claim") or {}
    if claim.get("status") != "ACTIVE":
        return "BLOCKED_CLAIM_NOT_ACTIVE"
    if not isinstance(claim.get("lease"), dict):
        return "BLOCKED_LEGACY_CLAIM_RECONCILIATION_REQUIRED"
    try:
        lease = lease_of(claim)
    except ValueError:
        return "BLOCKED_INVALID_LEASE"
    if not lease["updated_at"] <= now < lease["expires_at"]:
        return "BLOCKED_LEASE_EXPIRED_OR_CLOCK_DRIFT"
    contract = queue.get("surface_claims_contract") or {}
    if contract.get("mode") != ENFORCED or contract.get("current_enforcement") != ENFORCED:
        return "BLOCKED_QUEUE_STILL_OBSERVATION_ONLY"
    return "STRUCTURAL_LEASE_PRESENT_EXECUTOR_NOT_YET_CERTIFIED"


def run(client, expected_api_sha, expected_frontend_sha, now=None):
    heads = {"API": expected_api_sha, "FRONTEND": expected_frontend_sha}
    observed = remote_heads(client)
    if observed != heads:
        raise WriterRefusal("HEAD_TUPLE_DRIFT")
    verify_token_scope(client.get, heads)
    queue = queue_at(client, heads["API"])
    status = assess(queue, int(time.time()) if now is None else now)
    return {
        "project": "CS-AFRICAFUNDS-001",
        "task": TASK,
        "queue": QUEUE_PATH,
        "heads": observed,
        "claim_gate": status,
        "github_mutations": 0,
        "writer_gate": "CLOSED",
        "source": "LIVE_GITHUB_QUEUE_WITH_SCOPED_CUG_TOKEN",
        "autonomous_cycles_certified": 0,
    }


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-sha", required=True)
    parser.add_argument("--frontend-sha", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    client = GithubHTTP(os.environ.get("AF_CUG_INSTALLATION_TOKEN", ""))
    result = run(client, args.api_sha, args.frontend_sha)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("CLAIM_GATE=" + result["claim_gate"])
    print("WRITER_GATE=CLOSED")
    print("GITHUB_MUTATIONS=0")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError) as error:
        print("CLAIM_PREFLIGHT_FAILED=" + str(error))
        raise SystemExit(1)
