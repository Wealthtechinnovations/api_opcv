#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOOKUP = ROOT / "scripts/governance/incident_lookup.py"

def call(*args):
    return subprocess.run(
        ["python3", str(LOOKUP), *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

p = call("--signature", "mariadb-service-down-or-oom-killed")
assert p.returncode == 0, p.stderr
j = json.loads(p.stdout)
assert j["found"] is True
assert j["matches"][0]["id"] == "AF-INC-20260817-001"
assert j["matches"][0]["root_cause"]["status"] == "UNKNOWN"
assert "AF-OPS-003" in j["matches"][0]["linked_tasks"]
assert "AF-EVD-040" in j["matches"][0]["root_cause"]["evidence_refs"]
assert "AF-EVD-044" in j["matches"][0]["root_cause"]["evidence_refs"]

p = call("--id", "AF-INC-20260914-001")
assert p.returncode == 0
j = json.loads(p.stdout)
assert j["matches"][0]["status"] == "CLOSED"
assert j["matches"][0]["root_cause"]["status"] == "PROVEN"
assert j["matches"][0]["corrective_actions"]

p = call("--signature", "does-not-exist")
assert p.returncode == 2

print("INCIDENT_LOOKUP_TEST=PASS")
