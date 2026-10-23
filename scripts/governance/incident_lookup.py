#!/usr/bin/env python3
"""Read-only lookup of known AfricaFunds incidents before triage or recovery."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / ".governance/incidents/registry.json"

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--id")
    group.add_argument("--signature")
    args = parser.parse_args()

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    matches = []
    for incident in registry.get("incidents", []):
        if args.id and incident.get("id") == args.id:
            matches.append(incident)
        elif args.signature and incident.get("recurrence", {}).get("signature") == args.signature:
            matches.append(incident)

    if not matches:
        print(json.dumps({"found": False, "query": args.id or args.signature}, indent=2))
        raise SystemExit(2)

    safe = []
    for incident in matches:
        safe.append({
            "id": incident.get("id"),
            "title": incident.get("title"),
            "severity": incident.get("severity"),
            "status": incident.get("status"),
            "signature": incident.get("recurrence", {}).get("signature"),
            "occurrence_count": incident.get("recurrence", {}).get("occurrence_count"),
            "mechanism": incident.get("mechanism"),
            "root_cause": incident.get("root_cause"),
            "linked_tasks": incident.get("linked_tasks", []),
            "corrective_actions": incident.get("corrective_actions", []),
            "preventive_actions": incident.get("preventive_actions", []),
            "postmortem_ref": incident.get("postmortem_ref"),
            "closure": incident.get("closure"),
        })

    print(json.dumps({"found": True, "matches": safe}, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
