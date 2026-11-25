#!/usr/bin/env python3
"""Offline contract: no GitHub token, git credentials or network required."""
import copy
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cug_token_preflight import AdmissionError, BRANCH, OWNER, REPOS, observe

SHA_API = "a" * 40
SHA_FRONT = "b" * 40
HEADS = {"API": SHA_API, "FRONTEND": SHA_FRONT}
DATE = format_datetime(datetime.fromtimestamp(1800000000, timezone.utc), usegmt=True)


def responses():
    result = {
        "/installation/repositories?per_page=100": {
            "total_count": 2,
            "repositories": [
                {"id": REPOS[role][1], "full_name": OWNER + "/" + REPOS[role][0]}
                for role in REPOS
            ],
        },
    }
    for role, (repo, identity) in REPOS.items():
        result[f"/repos/{OWNER}/{repo}"] = {
            "id": identity, "full_name": OWNER + "/" + repo,
            "owner": {"id": 94637590}, "default_branch": BRANCH,
            "permissions": {"push": True},
        }
        result[f"/repos/{OWNER}/{repo}/git/ref/heads/{BRANCH}"] = {
            "ref": "refs/heads/" + BRANCH,
            "object": {"type": "commit", "sha": HEADS[role]},
        }
    return result


def perform(payloads, now=lambda: 1800000000.0, response_date=DATE):
    calls = []
    def get(path):
        calls.append(path)
        return copy.deepcopy(payloads[path]), response_date
    return observe(get, HEADS, now=now), calls


class CUGTokenContract(unittest.TestCase):
    def test_happy_path_attests_scope_and_remains_read_only(self):
        result, calls = perform(responses())
        self.assertEqual(result["app_installation_token_scope"], "TWO_REPOSITORIES_ATTESTED")
        self.assertEqual(result["writer_gate"], "CLOSED_UNTIL_LEASE_FENCING_AND_CODER_ATTESTED")
        self.assertFalse(result["github_write_performed"])
        self.assertEqual(len(calls), 5)
        self.assertTrue(all(c.startswith(("/repos/", "/installation/repositories")) for c in calls))

    def test_refuses_broad_installation_token(self):
        data = responses()
        data["/installation/repositories?per_page=100"]["total_count"] = 13
        with self.assertRaisesRegex(AdmissionError, "APP_TOKEN_NOT_LIMITED"):
            perform(data)

    def test_refuses_token_with_wrong_repository(self):
        data = responses()
        data["/installation/repositories?per_page=100"]["repositories"][1]["id"] = 123
        with self.assertRaisesRegex(AdmissionError, "REPOSITORY_SET_DRIFT"):
            perform(data)

    def test_refuses_missing_push_permission(self):
        data = responses()
        data[f"/repos/{OWNER}/{REPOS['API'][0]}"]["permissions"]["push"] = False
        with self.assertRaisesRegex(AdmissionError, "CONTENTS_WRITE_NOT_ATTESTED"):
            perform(data)

    def test_refuses_wrong_branch(self):
        data = responses()
        data[f"/repos/{OWNER}/{REPOS['FRONTEND'][0]}"]["default_branch"] = "main"
        with self.assertRaisesRegex(AdmissionError, "REPOSITORY_IDENTITY_DRIFT"):
            perform(data)

    def test_refuses_diverged_remote_head(self):
        data = responses()
        data[f"/repos/{OWNER}/{REPOS['API'][0]}/git/ref/heads/{BRANCH}"]["object"]["sha"] = "c" * 40
        with self.assertRaisesRegex(AdmissionError, "HEAD_TUPLE_DRIFT"):
            perform(data)

    def test_refuses_wrong_repo_owner(self):
        data = responses()
        data[f"/repos/{OWNER}/{REPOS['API'][0]}"]["owner"]["id"] = -1
        with self.assertRaisesRegex(AdmissionError, "REPOSITORY_IDENTITY_DRIFT"):
            perform(data)

    def test_refuses_untrusted_clock(self):
        with self.assertRaisesRegex(AdmissionError, "GITHUB_CLOCK_SKEW"):
            perform(responses(), now=lambda: 1800001000.0)

    def test_refuses_missing_date_zone(self):
        with self.assertRaisesRegex(AdmissionError, "GITHUB_CLOCK_UNTRUSTED"):
            perform(responses(), response_date="Wed, 01 Jan 2020 12:00:00")

    def test_refuses_wrong_token_repository_names(self):
        data = responses()
        data["/installation/repositories?per_page=100"]["repositories"][0]["full_name"] = "other/another"
        with self.assertRaisesRegex(AdmissionError, "REPOSITORY_NAMES_DRIFT"):
            perform(data)


    def test_workflow_reuses_cug_credential_aliases_without_accessing_secret_values(self):
        workflow = (Path(__file__).resolve().parents[2] /
                    ".github/workflows/africafunds-cug-access-preflight.yml").read_text(encoding="utf-8")
        for variable in ("vars.AF_CUG_APP_ID", "vars.CUG_APP_ID", "vars.CUG_GITHUB_APP_ID"):
            self.assertIn(variable, workflow)
        for key in ("secrets.AF_CUG_PRIVATE_KEY", "secrets.CUG_PRIVATE_KEY",
                    "secrets.CUG_APP_PRIVATE_KEY", "secrets.CUG_GITHUB_APP_PRIVATE_KEY"):
            self.assertIn(key, workflow)
        self.assertIn("CUG_CREDENTIALS_UNAVAILABLE_FOR_THIS_REPOSITORY; WRITER_GATE_CLOSED", workflow)

    def test_workflow_does_not_publish_code_or_mutate_production(self):
        workflow = (Path(__file__).resolve().parents[2] /
                    ".github/workflows/africafunds-cug-access-preflight.yml").read_text(encoding="utf-8")
        self.assertIn("permissions:\n  contents: read", workflow)
        self.assertNotIn("permissions:\n  contents: write", workflow)
        self.assertNotIn("git push", workflow)
        self.assertNotIn("kubectl", workflow)
        self.assertNotIn("docker compose", workflow)


if __name__ == "__main__":
    unittest.main()
