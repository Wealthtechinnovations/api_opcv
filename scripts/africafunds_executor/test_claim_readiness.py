#!/usr/bin/env python3
"""Live-admission status is read-only and refuses all legacy/unknown states."""
from copy import deepcopy
from pathlib import Path
import sys
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import claim_readiness
from test_governed_cas import MockGitHub, canonical_queue, NOW, A, B


class ReadinessContract(unittest.TestCase):
    def test_existing_legacy_active_claim_is_not_silently_adopted(self):
        q = canonical_queue()
        del q["tasks"][0]["claim"]["lease"]
        self.assertEqual(claim_readiness.assess(q, NOW),
                         "BLOCKED_LEGACY_CLAIM_RECONCILIATION_REQUIRED")

    def test_released_claim_cannot_be_taken(self):
        q = canonical_queue()
        q["tasks"][0]["claim"]["status"] = "RELEASED"
        self.assertEqual(claim_readiness.assess(q, NOW), "BLOCKED_CLAIM_NOT_ACTIVE")

    def test_queue_observe_only_is_not_writer_ready(self):
        q = canonical_queue()
        q["surface_claims_contract"]["mode"] = "OBSERVE_ONLY"
        self.assertEqual(claim_readiness.assess(q, NOW), "BLOCKED_QUEUE_STILL_OBSERVATION_ONLY")

    def test_expired_lease_refused(self):
        q = canonical_queue()
        q["tasks"][0]["claim"]["lease"]["expires_at"] = NOW - 1
        self.assertEqual(claim_readiness.assess(q, NOW),
                         "BLOCKED_LEASE_EXPIRED_OR_CLOCK_DRIFT")

    def test_structural_lease_does_not_certify_an_agent(self):
        q = canonical_queue()
        self.assertEqual(claim_readiness.assess(q, NOW),
                         "STRUCTURAL_LEASE_PRESENT_EXECUTOR_NOT_YET_CERTIFIED")

    def test_live_reader_uses_existing_queue_and_returns_no_write(self):
        client = MockGitHub()
        data = claim_readiness.run(client, A, B, now=NOW)
        self.assertEqual(data["github_mutations"], 0)
        self.assertEqual(data["writer_gate"], "CLOSED")
        self.assertEqual(data["autonomous_cycles_certified"], 0)
        self.assertEqual(data["source"], "LIVE_GITHUB_QUEUE_WITH_SCOPED_CUG_TOKEN")
        self.assertEqual(client.mutations, [])

    def test_missing_task_is_not_recreated(self):
        q = canonical_queue()
        q["tasks"] = []
        self.assertEqual(claim_readiness.assess(q, NOW), "BLOCKED_TASK_MISSING")

    def test_workflow_does_not_unlock_on_readiness_success(self):
        wf = (Path(__file__).resolve().parents[2] /
              ".github/workflows/africafunds-cug-access-preflight.yml").read_text()
        self.assertIn("permissions:\n  contents: read", wf)
        self.assertIn("CLAIM", (Path(__file__).resolve().parent /
                               "claim_readiness.py").read_text())
        self.assertNotIn("git push", wf)


if __name__ == "__main__":
    unittest.main()
