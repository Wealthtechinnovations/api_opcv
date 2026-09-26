#!/usr/bin/env python3
"""AfricaFunds Programme Directeur — derived read-only orchestrator.

This script creates no task, changes no state and performs no deployment.
The single task authority remains .governance/loop/task-queue.json.
It derives an execution view from existing AfricaFunds authorities.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from collections import defaultdict, deque
from pathlib import Path

PROJECT_UID = "CS-AFRICAFUNDS-001"
QUEUE_AUTHORITY = ".governance/loop/task-queue.json"
STATE_AUTHORITY = ".governance/loop/state.json"
HANDOFF_AUTHORITY = ".governance/loop/handoff.json"
EVIDENCE_AUTHORITY = ".governance/knowledge/evidence.json"
INCIDENT_AUTHORITY = ".governance/incidents/registry.json"
GLOBAL_SUIVI = "SUIVI.md"

TERMINAL = {
    "DONE",
    "DONE_WITH_EXTERNAL_GAPS",
    "DONE_WITH_EXTERNAL_TRUST_GAP",
    "CLOSED",
}
BLOCKED_STATUS = {
    "BLOCKED_HUMAN_APPROVAL",
    "BLOCKED_EXTERNAL_PROVIDER_ROTATION",
    "BLOCKED_EXTERNAL_SECRET",
    "SECURITY_GATE",
}
OPEN_STATUS = {"OPEN", "READY", "PENDING", "IN_PROGRESS"}

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def git(root: Path, *args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(root), *args], text=True
    ).strip()

def classify_stream(task: dict) -> str:
    tid = task.get("id", "")
    title = task.get("title", "").lower()
    if tid.startswith("AF-OPS-"):
        if any(x in title for x in (
            "data integrity", "performance integrity", "data freshness"
        )):
            return "DATA"
        return "OPS"
    if tid.startswith("AF-TASK-") and "allocation" in title:
        return "PRODUCT"
    return "GOVERNANCE"

def classify_program(task: dict) -> str:
    tid = task.get("id", "")
    title = task.get("title", "").lower()
    if tid in {"AF-OPS-001", "AF-OPS-003", "AF-OPS-004", "AF-OPS-006"}:
        return "PRODUCTION_STABILITY"
    if tid == "AF-OPS-005" or "secret" in title:
        return "SECURITY_RUNTIME_IDENTITY"
    if tid in {"AF-OPS-007", "AF-OPS-008", "AF-OPS-009"}:
        return "DATA_QUALITY"
    if "allocation" in title:
        return "ALLOCATION"
    return "GOVERNANCE_CONTINUITY"

def execution_mode_hint(task: dict) -> str:
    status = task.get("status", "")
    phase = task.get("phase", "")
    tid = task.get("id", "")
    if status in TERMINAL:
        return "NONE_COMPLETED"
    if status in BLOCKED_STATUS:
        return "EXTERNAL_OR_HUMAN_GATE"
    if "READ_ONLY" in phase or tid in {"AF-OPS-003", "AF-OPS-005", "AF-OPS-007", "AF-OPS-009"}:
        return "AUTO_READ_ONLY_OR_GOVERNED_FIX"
    if tid == "AF-TASK-007":
        return "GOV006_DEPLOY"
    return "GOVERNED_CODE_CHANGE"

def topo_waves(tasks: dict[str, dict], terminal: set[str]):
    pending = {tid for tid, t in tasks.items() if t.get("status") not in terminal}
    indegree = {tid: 0 for tid in pending}
    children = defaultdict(list)
    for tid in pending:
        for dep in tasks[tid].get("depends_on", []) or []:
            if dep in pending:
                indegree[tid] += 1
                children[dep].append(tid)
    q = deque(sorted(tid for tid, d in indegree.items() if d == 0))
    wave = {}
    while q:
        tid = q.popleft()
        dep_waves = [
            wave[d] for d in tasks[tid].get("depends_on", []) or [] if d in wave
        ]
        wave[tid] = (max(dep_waves) + 1) if dep_waves else 0
        for child in children[tid]:
            indegree[child] -= 1
            if indegree[child] == 0:
                q.append(child)
    cycles = sorted(tid for tid in pending if tid not in wave)
    grouped = defaultdict(list)
    for tid, level in wave.items():
        grouped[level].append(tid)
    return [
        {"wave": level, "task_ids": sorted(ids)}
        for level, ids in sorted(grouped.items())
    ], cycles

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--api-root", required=True)
    p.add_argument("--frontend-root", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()

    api = Path(args.api_root).resolve()
    front = Path(args.frontend_root).resolve()

    project = load(api / ".governance/project.json")
    queue = load(api / QUEUE_AUTHORITY)
    state = load(api / STATE_AUTHORITY)
    handoff = load(api / HANDOFF_AUTHORITY)
    evidence = load(api / EVIDENCE_AUTHORITY)
    incidents = load(api / INCIDENT_AUTHORITY)

    errors = []
    warnings = []

    if project.get("project_uid") != PROJECT_UID:
        errors.append("PROJECT_UID_DRIFT")
    if project.get("state_model") != "FUND_STATE":
        errors.append("FUND_STATE_MODEL_DRIFT")
    expected_fields = [
        "API_SHA", "FRONTEND_SHA", "SUIVI_CHECKPOINT", "PRODUCTION_ATTESTATION"
    ]
    if project.get("state_fields") != expected_fields:
        errors.append("FUND_STATE_FIELDS_DRIFT")
    if queue.get("active_loop_id") != state.get("loop_id"):
        errors.append("QUEUE_STATE_LOOP_DRIFT")
    if handoff.get("loop_id") != state.get("loop_id"):
        errors.append("HANDOFF_STATE_LOOP_DRIFT")
    if not (front / GLOBAL_SUIVI).exists():
        errors.append("GLOBAL_SUIVI_MISSING")

    task_rows = queue.get("tasks", [])
    ids = [t.get("id") for t in task_rows]
    duplicates = sorted({x for x in ids if ids.count(x) > 1})
    if duplicates:
        errors.append("DUPLICATE_TASK_IDS:" + ",".join(duplicates))

    tasks = {t["id"]: t for t in task_rows if t.get("id")}
    missing_deps = []
    for tid, task in tasks.items():
        for dep in task.get("depends_on", []) or []:
            if dep not in tasks:
                missing_deps.append({"task_id": tid, "missing_dependency": dep})
    if missing_deps:
        errors.append("MISSING_TASK_DEPENDENCIES")

    waves, cycles = topo_waves(tasks, TERMINAL)
    if cycles:
        errors.append("DEPENDENCY_CYCLE:" + ",".join(cycles))

    operational_id = state.get("operational_priority_task_id")
    operational = tasks.get(operational_id) if operational_id else None
    if operational_id and not operational:
        errors.append("OPERATIONAL_PRIORITY_MISSING_FROM_QUEUE")
    if operational and operational.get("status") in TERMINAL:
        errors.append("OPERATIONAL_PRIORITY_ALREADY_TERMINAL")

    ready = []
    blocked = []
    running = []
    waiting_for_evidence = []
    completed = []
    enriched = []

    for tid, task in tasks.items():
        status = task.get("status", "UNKNOWN")
        deps = task.get("depends_on", []) or []
        unmet = [
            dep for dep in deps
            if dep in tasks and tasks[dep].get("status") not in TERMINAL
        ]
        row = {
            "id": tid,
            "title": task.get("title"),
            "status": status,
            "phase": task.get("phase"),
            "stream": classify_stream(task),
            "program": classify_program(task),
            "execution_mode_hint": execution_mode_hint(task),
            "depends_on": deps,
            "unmet_dependencies": unmet,
            "next_action": task.get("next_action"),
            "evidence_refs": task.get("evidence_refs", []),
        }
        enriched.append(row)

        if status in TERMINAL:
            completed.append(tid)
            continue
        if status == "IN_PROGRESS":
            running.append(tid)
        if status in BLOCKED_STATUS or unmet:
            blocked.append({
                "id": tid,
                "reason": "STATUS_BLOCKED" if status in BLOCKED_STATUS else "DEPENDENCY_GATED",
                "unmet_dependencies": unmet,
            })
            continue
        if status in OPEN_STATUS:
            ready.append(tid)
            phase = task.get("phase", "") or ""
            if any(token in phase for token in ("RCA", "PREFLIGHT", "VALIDATION")):
                waiting_for_evidence.append(tid)

    # Dependency-only parallel candidates. File-surface safety is intentionally
    # not claimed until touched_surfaces/conflicts_with are materialised.
    parallel_candidates = []
    if operational_id and operational_id in tasks:
        op_deps = set(tasks[operational_id].get("depends_on", []) or [])
        for tid in ready:
            if tid == operational_id:
                continue
            deps = set(tasks[tid].get("depends_on", []) or [])
            if operational_id not in deps and tid not in op_deps:
                parallel_candidates.append(tid)

    evidence_items = evidence.get("evidence") or evidence.get("items") or []
    evidence_ids = {e.get("id") for e in evidence_items}
    dangling_evidence = []
    for task in task_rows:
        for ref in task.get("evidence_refs", []) or []:
            if ref not in evidence_ids:
                dangling_evidence.append({"task_id": task.get("id"), "evidence_ref": ref})
    if dangling_evidence:
        warnings.append("DANGLING_EVIDENCE_REFS")

    current_handoff_op = (handoff.get("resume_contract") or {}).get("current_operational_task")
    if operational_id and current_handoff_op and operational_id != current_handoff_op:
        warnings.append("HANDOFF_OPERATIONAL_PRIORITY_DRIFT")

    api_sha = git(api, "rev-parse", "HEAD")
    frontend_sha = git(front, "rev-parse", "HEAD")
    suivi_text = (front / GLOBAL_SUIVI).read_text(encoding="utf-8")
    checkpoint = next(
        (line.lstrip("# ").strip() for line in suivi_text.splitlines()
         if line.startswith("## POINT DE REPRISE COURANT")),
        "SUIVI_PRESENT_NO_EXPLICIT_CHECKPOINT",
    )

    # Explicit continuity contract derived from already-existing authorities.
    continuity_contract = {
        "one_product_two_repositories": len(project.get("repositories", [])) == 2,
        "single_task_queue_authority": QUEUE_AUTHORITY,
        "state_authority": STATE_AUTHORITY,
        "handoff_authority": HANDOFF_AUTHORITY,
        "evidence_authority": EVIDENCE_AUTHORITY,
        "incident_authority": INCIDENT_AUTHORITY,
        "global_checkpoint": "front_end_opcvm/SUIVI.md",
        "new_branch_creation": (state.get("rules") or {}).get("new_branch_creation"),
        "single_writer": (state.get("rules") or {}).get("single_writer"),
        "verify_both_heads_before_write": (state.get("rules") or {}).get("verify_both_heads_before_write"),
        "no_blind_work": (state.get("rules") or {}).get("no_blind_work"),
        "program_director_is_derived_not_authority": True,
        "no_second_queue": True,
        "production_commit_is_not_automatic_deploy": True,
    }

    result = {
        "schema_version": "0.1.0",
        "project_uid": PROJECT_UID,
        "mode": "DERIVED_READ_ONLY",
        "authorities": {
            "queue": QUEUE_AUTHORITY,
            "state": STATE_AUTHORITY,
            "handoff": HANDOFF_AUTHORITY,
            "evidence": EVIDENCE_AUTHORITY,
            "incidents": INCIDENT_AUTHORITY,
            "global_suivi": "front_end_opcvm/SUIVI.md",
        },
        "fund_state": {
            "API_SHA": api_sha,
            "FRONTEND_SHA": frontend_sha,
            "SUIVI_CHECKPOINT": checkpoint,
            "PRODUCTION_ATTESTATION": "REQUIRES_LIVE_OBSERVATION",
        },
        "continuity_contract": continuity_contract,
        "operational_priority": {
            "task_id": operational_id,
            "status": operational.get("status") if operational else None,
            "phase": operational.get("phase") if operational else None,
            "next_action": operational.get("next_action") if operational else None,
        },
        "ready": sorted(ready),
        "running": sorted(running),
        "blocked": sorted(blocked, key=lambda x: x["id"]),
        "waiting_for_evidence": sorted(waiting_for_evidence),
        "parallel_candidates_dependency_only": sorted(parallel_candidates),
        "parallel_safety": "DEPENDENCY_ONLY_NOT_FILE_SURFACE_CERTIFIED",
        "dependency_waves": waves,
        "tasks": sorted(enriched, key=lambda x: x["id"]),
        "completed_count": len(completed),
        "open_count": len(task_rows) - len(completed),
        "incident_summary": [
            {
                "id": x.get("id"),
                "status": x.get("status"),
                "severity": x.get("severity"),
                "root_cause_status": (x.get("root_cause") or {}).get("status"),
            }
            for x in incidents.get("incidents", [])
        ],
        "integrity": {
            "status": "PASS" if not errors else "FAIL",
            "errors": errors,
            "warnings": warnings,
            "missing_dependencies": missing_deps,
            "dependency_cycles": cycles,
            "dangling_evidence_refs": dangling_evidence,
        },
        "next_recommended_action": (
            {
                "type": "CONTINUE_OPERATIONAL_PRIORITY",
                "task_id": operational_id,
                "reason": "state.json operational_priority_task_id",
            }
            if operational_id and operational and operational.get("status") not in TERMINAL
            else {
                "type": "SELECT_FIRST_READY",
                "task_id": sorted(ready)[0] if ready else None,
                "reason": "no non-terminal operational priority",
            }
        ),
    }

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)

if __name__ == "__main__":
    main()
