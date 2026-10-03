#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / ".governance/incidents/registry.json"
QUEUE = ROOT / ".governance/loop/task-queue.json"
EVIDENCE = ROOT / ".governance/knowledge/evidence.json"

ALLOWED_STATUS = {
    "DETECTED", "TRIAGED", "CONTAINED", "MITIGATED", "RCA_PENDING",
    "CORRECTIVE_ACTION_IN_PROGRESS", "VERIFYING", "RESOLVED", "CLOSED",
    "BLOCKED_EXTERNAL",
}
ALLOWED_ROOT_STATUS = {"PROVEN", "PROBABLE", "UNKNOWN"}
INCIDENT_ID = re.compile(r"^AF-INC-[0-9]{8}-[0-9]{3}$")

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    registry = load(REGISTRY)
    queue = load(QUEUE)
    evidence = load(EVIDENCE)
    errors: list[str] = []

    tasks = {item.get("id"): item for item in queue.get("tasks", [])}
    evidence_ids = {item.get("id") for item in evidence.get("evidence", [])}
    incident_ids: set[str] = set()

    for incident in registry.get("incidents", []):
        iid = incident.get("id")
        if iid in incident_ids:
            errors.append(f"DUPLICATE_INCIDENT:{iid}")
        incident_ids.add(iid)

        if not INCIDENT_ID.fullmatch(iid or ""):
            errors.append(f"BAD_ID:{iid}")
        if incident.get("status") not in ALLOWED_STATUS:
            errors.append(f"BAD_STATUS:{iid}")

        root = incident.get("root_cause", {})
        mechanism = incident.get("mechanism", {})
        if root.get("status") not in ALLOWED_ROOT_STATUS:
            errors.append(f"BAD_ROOT_STATUS:{iid}")
        if mechanism.get("status") not in ALLOWED_ROOT_STATUS:
            errors.append(f"BAD_MECHANISM_STATUS:{iid}")
        if root.get("status") == "PROVEN" and not root.get("evidence_refs"):
            errors.append(f"PROVEN_ROOT_WITHOUT_EVIDENCE:{iid}")
        if mechanism.get("status") == "PROVEN" and not mechanism.get("evidence_refs"):
            errors.append(f"PROVEN_MECHANISM_WITHOUT_EVIDENCE:{iid}")

        recurrence = incident.get("recurrence", {})
        recurring = int(recurrence.get("occurrence_count", 0)) > 1
        if recurring and recurrence.get("escalation_required") is not True:
            errors.append(f"RECURRENT_WITHOUT_ESCALATION:{iid}")
        if recurring and incident.get("status") != "CLOSED" and not incident.get("linked_tasks"):
            errors.append(f"RECURRENT_WITHOUT_GOVERNED_TASK:{iid}")

        if incident.get("status") == "CLOSED":
            closure = incident.get("closure", {})
            if root.get("status") != "PROVEN":
                errors.append(f"CLOSED_WITHOUT_PROVEN_ROOT:{iid}")
            if closure.get("criteria_met") is not True:
                errors.append(f"CLOSED_WITHOUT_VERIFIED_CLOSURE:{iid}")
            if not closure.get("verification_refs"):
                errors.append(f"CLOSED_WITHOUT_VERIFICATION:{iid}")

        for task_ref in incident.get("linked_tasks", []):
            if task_ref not in tasks:
                errors.append(f"UNKNOWN_TASK:{iid}:{task_ref}")

        refs = (
            incident.get("evidence_refs", [])
            + root.get("evidence_refs", [])
            + mechanism.get("evidence_refs", [])
        )
        for ref in refs:
            if isinstance(ref, str) and ref.startswith("AF-EVD-") and ref not in evidence_ids:
                errors.append(f"UNKNOWN_EVIDENCE:{iid}:{ref}")

        postmortem_ref = incident.get("postmortem_ref", "")
        if not postmortem_ref:
            errors.append(f"MISSING_POSTMORTEM_REF:{iid}")
        elif not (ROOT / postmortem_ref).exists():
            errors.append(f"MISSING_POSTMORTEM:{iid}:{postmortem_ref}")

        for action in incident.get("corrective_actions", []):
            aid = action.get("id")
            if not aid or not action.get("status") or not action.get("description"):
                errors.append(f"BAD_CORRECTIVE_ACTION:{iid}:{aid}")
            for task_ref in action.get("task_refs", []):
                if task_ref not in tasks:
                    errors.append(f"UNKNOWN_ACTION_TASK:{iid}:{task_ref}")
            if action.get("status") == "DONE":
                if not action.get("patch_refs"):
                    errors.append(f"DONE_ACTION_WITHOUT_PATCH:{iid}:{aid}")
                if not action.get("test_refs"):
                    errors.append(f"DONE_ACTION_WITHOUT_TEST:{iid}:{aid}")
                if not action.get("verification_refs"):
                    errors.append(f"DONE_ACTION_WITHOUT_VERIFICATION:{iid}:{aid}")

    for task_id, task in tasks.items():
        for incident_ref in task.get("incident_refs", []):
            if incident_ref not in incident_ids:
                errors.append(f"TASK_REFERENCES_UNKNOWN_INCIDENT:{task_id}:{incident_ref}")

    result = {
        "schema_version": "1.1.0",
        "project_uid": "CS-AFRICAFUNDS-001",
        "incident_count": len(incident_ids),
        "task_count": len(tasks),
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
    raise SystemExit(1 if errors else 0)

if __name__ == "__main__":
    main()
