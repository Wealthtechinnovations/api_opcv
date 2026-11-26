#!/usr/bin/env python3
"""Offline, deterministic contract for an exact CAS GitHub writer boundary."""
from __future__ import annotations

import base64
from copy import deepcopy
from datetime import datetime, timezone
from email.utils import format_datetime
import json
from pathlib import Path
import sys
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import governed_cas

A = "a" * 40
B = "b" * 40
C = "c" * 40
D = "d" * 40
OWNER = "agent:AF-TASK-028"
SESSION = "AF-AUTONOMY-SESSION-0001"
EFFECT = "scripts/africafunds_executor/example.js"
NOW = int(time.time())
DATE = format_datetime(datetime.fromtimestamp(NOW, timezone.utc), usegmt=True)


def canonical_queue():
    return {
        "surface_claims_contract": {
            "storage": "TASK_LOCAL_IN_SINGLE_QUEUE",
            "mode": "FENCED_CAS_ENFORCED",
            "current_enforcement": "FENCED_CAS_ENFORCED",
        },
        "tasks": [{
            "id": "AF-TASK-028",
            "status": "IN_PROGRESS",
            "execution_mode": "GOVERNED_CODE_CHANGE",
            "depends_on": [],
            "repository_roles": ["API", "FRONTEND"],
            "touched_surfaces": ["scripts/africafunds_executor/**"],
            "claim": {
                "status": "ACTIVE",
                "owner": OWNER,
                "repository_roles": ["API", "FRONTEND"],
                "touched_surfaces": ["scripts/africafunds_executor/**"],
                "lease": {
                    "version": 1,
                    "session": SESSION,
                    "generation": 1,
                    "updated_at": NOW - 10,
                    "expires_at": NOW + 240,
                },
            },
        }],
    }


class MockGitHub:
    def __init__(self):
        self.heads = {"API": A, "FRONTEND": B}
        self.queue = canonical_queue()
        self.parents = {"API": [A], "FRONTEND": [B]}
        self.files = {k: [{"filename": EFFECT, "status": "modified"}]
                      for k in ("API", "FRONTEND")}
        self.installed_count = 2
        self.errors = False
        self.drifts_other_role = False
        self.calls = []
        self.mutations = []

    def get(self, path):
        self.calls.append(("get", path))
        if path == "/installation/repositories?per_page=100":
            return {"total_count": self.installed_count,
                    "repositories": [
                        {"id": identity, "full_name": "Wealthtechinnovations/" + name}
                        for name, identity in governed_cas.REPOSITORIES.values()]}, DATE
        for role, (name, identity) in governed_cas.REPOSITORIES.items():
            root = "/repos/Wealthtechinnovations/" + name
            if path == root:
                return {"id": identity, "node_id": "R_test_" + role,
                        "full_name": "Wealthtechinnovations/" + name,
                        "owner": {"id": 94637590},
                        "default_branch": governed_cas.BRANCH}, DATE
            if path == root + "/git/ref/heads/" + governed_cas.BRANCH:
                return {"ref": "refs/heads/" + governed_cas.BRANCH,
                        "object": {"type": "commit", "sha": self.heads[role]}}, DATE
            if path == root + "/commits/" + (C if role == "API" else D):
                return {"parents": [{"sha": p} for p in self.parents[role]],
                        "files": deepcopy(self.files[role])}, DATE
            if path == root + "/contents/" + governed_cas.QUEUE_PATH + "?ref=" + A:
                return {"path": governed_cas.QUEUE_PATH, "encoding": "base64",
                        "content": base64.b64encode(json.dumps(self.queue).encode()).decode()}, DATE
        raise AssertionError("Unexpected REST access: " + path)

    def graphql(self, vars):
        self.mutations.append(deepcopy(vars))
        update = vars["input"]["refUpdates"][0]
        if self.errors:
            return {"errors": [{"message": "stale ref"}]}
        if self.heads["API"] == update["beforeOid"]:
            role = "API"
        elif self.heads["FRONTEND"] == update["beforeOid"]:
            role = "FRONTEND"
        else:
            raise AssertionError("mutation attempted with mismatched beforeOid")
        self.heads[role] = update["afterOid"]
        if self.drifts_other_role:
            other = "FRONTEND" if role == "API" else "API"
            self.heads[other] = C if other == "API" else D
        return {"data": {"updateRefs": {
            "clientMutationId": vars["input"]["clientMutationId"]}}}


def publish(client=None, **kw):
    c = client or MockGitHub()
    role = kw.pop("role", "API")
    effect = kw.pop("effects", [EFFECT])
    result = governed_cas.publish_one(
        c, role=role, expected_heads={"API": A, "FRONTEND": B},
        candidate=C if role == "API" else D,
        task_id="AF-TASK-028", owner=OWNER, session=SESSION, generation=1,
        effects=effect, now=NOW, **kw
    )
    return result, c


class GovernedCASContract(unittest.TestCase):
    def test_exact_cas_success_and_no_force(self):
        result, c = publish()
        self.assertEqual(result["status"], "APPLIED")
        self.assertEqual(c.heads["API"], C)
        self.assertEqual(len(c.mutations), 1)
        update = c.mutations[0]["input"]["refUpdates"][0]
        self.assertEqual(update["beforeOid"], A)
        self.assertEqual(update["afterOid"], C)
        self.assertFalse(update["force"])
        self.assertEqual(c.mutations[0]["input"]["repositoryId"], "R_test_API")

    def test_frontend_allowed_with_unchanged_api_queue(self):
        result, c = publish(role="FRONTEND")
        self.assertEqual(result["status"], "APPLIED")
        self.assertEqual(c.heads, {"API": A, "FRONTEND": D})

    def test_real_queue_observe_only_blocks_writes(self):
        c = MockGitHub()
        c.queue["surface_claims_contract"]["mode"] = "OBSERVE_ONLY"
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "LIVE_WRITER_ENFORCEMENT_NOT_ACTIVE"):
            publish(c)
        self.assertEqual(c.mutations, [])

    def test_legacy_claim_without_lease_refused(self):
        c = MockGitHub()
        del c.queue["tasks"][0]["claim"]["lease"]
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "LEGACY_OR_INVALID_LEASE"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_wrong_owner_refused(self):
        c = MockGitHub()
        c.queue["tasks"][0]["claim"]["owner"] = "another-agent"
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "STALE_FENCE_OR_IDENTITY"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_expired_lease_refused(self):
        c = MockGitHub()
        c.queue["tasks"][0]["claim"]["lease"]["expires_at"] = NOW - 1
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "LEASE_EXPIRED"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_out_of_scope_effect_refused(self):
        c = MockGitHub()
        c.files["API"] = [{"filename": ".env", "status": "modified"}]
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "EFFECT_OUTSIDE_SCOPE"):
            publish(c, effects=[".env"])
        self.assertFalse(c.mutations)

    def test_candidate_not_exact_child_refused(self):
        c = MockGitHub()
        c.parents["API"] = [B]
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "CANDIDATE_NOT_EXACT_CHILD"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_changed_files_must_match_declared_effects(self):
        c = MockGitHub()
        c.files["API"] = [{"filename": EFFECT, "status": "modified"},
                          {"filename": "other.txt", "status": "added"}]
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "CANDIDATE_DIFF_SCOPE_MISMATCH"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_cug_token_scoped_to_two_repositories(self):
        c = MockGitHub()
        c.installed_count = 13
        with self.assertRaisesRegex(ValueError, "APP_TOKEN_NOT_LIMITED_TO_TWO_REPOSITORIES"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_graphql_error_is_not_treated_as_success(self):
        c = MockGitHub()
        c.errors = True
        result, _ = publish(c)
        self.assertEqual(result["status"], "UNKNOWN_EFFECT_REOBSERVE")
        self.assertEqual(c.heads, {"API": A, "FRONTEND": B})

    def test_other_repository_head_drift_after_cas_requires_reconciliation(self):
        c = MockGitHub()
        c.drifts_other_role = True
        result, _ = publish(c)
        self.assertEqual(result["status"], "PARTIAL_REOBSERVE")
        self.assertEqual(c.heads, {"API": C, "FRONTEND": D})

    def test_unknown_task_refused(self):
        c = MockGitHub()
        c.queue["tasks"][0]["id"] = "AF-OTHER"
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "TASK_UNKNOWN"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_fenced_generation_must_match(self):
        c = MockGitHub()
        c.queue["tasks"][0]["claim"]["lease"]["generation"] = 2
        with self.assertRaisesRegex(governed_cas.WriterRefusal, "STALE_FENCE_OR_IDENTITY"):
            publish(c)
        self.assertFalse(c.mutations)

    def test_same_git_repo_not_implicitly_all_repositories(self):
        c = MockGitHub()
        r, _ = publish(c)
        self.assertEqual(r["heads"]["FRONTEND"], B)
        self.assertEqual(len(c.mutations), 1)

    def test_module_cannot_self_start_as_scheduled_writer(self):
        source = (Path(__file__).resolve().parent / "governed_cas.py").read_text()
        self.assertIn('raise SystemExit("NOT_A_STANDALONE_EXECUTOR")', source)
        self.assertIn('"force": False', source)
        self.assertNotIn("subprocess.run(", source)
        self.assertNotIn("os.system(", source)
        self.assertNotIn("force\": True", source)


if __name__ == "__main__":
    unittest.main()
