#!/usr/bin/env python3
"""Derived chronological ledger for the AfricaFunds Programme Director.

Read-only by design. It does not replace evidence.json, incident registry,
Git history, task-queue.json, state.json or SUIVI.md.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

PROJECT_UID = "CS-AFRICAFUNDS-001"

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def git_log(root: Path, repository: str, limit: int = 60):
    fmt = "%H|%aI|%s"
    try:
        out = subprocess.check_output(
            ["git", "-C", str(root), "log", "-n", str(limit), "--pretty=format:" + fmt],
            text=True,
        ).strip()
    except Exception:
        return []
    rows = []
    for line in out.splitlines():
        parts = line.split("|", 2)
        if len(parts) != 3:
            continue
        sha, at, subject = parts
        rows.append({
            "at": at,
            "kind": "GIT_COMMIT",
            "source": repository,
            "ref": sha,
            "summary": subject,
        })
    return rows

def norm_time(value):
    if value is None:
        return None
    value = str(value).strip()
    if len(value) == 10 and value[4] == "-" and value[7] == "-":
        return value + "T00:00:00Z"
    return value

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--api-root", required=True)
    p.add_argument("--frontend-root", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()

    api = Path(a.api_root).resolve()
    front = Path(a.frontend_root).resolve()

    project = load(api / ".governance/project.json")
    evidence = load(api / ".governance/knowledge/evidence.json")
    incidents = load(api / ".governance/incidents/registry.json")
    queue = load(api / ".governance/loop/task-queue.json")
    state = load(api / ".governance/loop/state.json")

    if project.get("project_uid") != PROJECT_UID:
        raise SystemExit("PROJECT_UID_DRIFT")

    events = []
    evidence_items = evidence.get("evidence") or evidence.get("items") or []
    for item in evidence_items:
        at = norm_time(item.get("observed_at"))
        if not at:
            continue
        events.append({
            "at": at,
            "kind": "EVIDENCE",
            "source": ".governance/knowledge/evidence.json",
            "ref": item.get("id"),
            "event_type": item.get("type"),
            "result": item.get("result"),
            "summary": item.get("summary"),
        })

    for incident in incidents.get("incidents", []):
        iid = incident.get("id")
        recurrence = incident.get("recurrence") or {}
        for occurrence in recurrence.get("occurrences", []) or []:
            at = norm_time(occurrence)
            if not at:
                continue
            events.append({
                "at": at,
                "kind": "INCIDENT_OCCURRENCE",
                "source": ".governance/incidents/registry.json",
                "ref": iid,
                "severity": incident.get("severity"),
                "summary": "Documented incident occurrence",
            })

    events.extend(git_log(api, "Wealthtechinnovations/api_opcv"))
    events.extend(git_log(front, "Wealthtechinnovations/front_end_opcvm"))
    events.sort(key=lambda row: (
        row.get("at") or "",
        row.get("kind") or "",
        row.get("ref") or "",
    ))

    operational_id = state.get("operational_priority_task_id")
    task = next((x for x in queue.get("tasks", []) if x.get("id") == operational_id), None)

    result = {
        "schema_version": "0.1.0",
        "project_uid": PROJECT_UID,
        "mode": "DERIVED_EVENT_LEDGER",
        "authority": "NONE_DERIVED_ONLY",
        "source_authorities": [
            ".governance/knowledge/evidence.json",
            ".governance/incidents/registry.json",
            "Git history API",
            "Git history frontend",
        ],
        "operational_priority": {
            "task_id": operational_id,
            "phase": task.get("phase") if task else None,
            "status": task.get("status") if task else None,
        },
        "event_count": len(events),
        "latest_events": events[-250:],
    }

    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
