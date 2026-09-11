#!/usr/bin/env python3
"""Validate deterministic AfricaFunds operational-memory coherence."""
from __future__ import annotations
import argparse, json
from pathlib import Path

def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def contains(path, token):
    return token in Path(path).read_text(encoding="utf-8")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()

    state=load(api/".governance/loop/state.json")
    queue=load(api/".governance/loop/task-queue.json")
    handoff=load(api/".governance/loop/handoff.json")
    errors=[]

    loop_id=state.get("loop_id")
    task_id=state.get("current_task_id")
    if not loop_id: errors.append("STATE_LOOP_ID_MISSING")
    if queue.get("active_loop_id") != loop_id: errors.append("QUEUE_LOOP_ID_DRIFT")
    tasks={x.get("id"):x for x in queue.get("tasks",[])}
    if task_id not in tasks: errors.append("CURRENT_TASK_MISSING_FROM_QUEUE")
    elif tasks[task_id].get("status") not in {"IN_PROGRESS","BLOCKED_EXTERNAL_SECRET","SECURITY_GATE","PARTIALLY_ENFORCED"}:
        errors.append("CURRENT_TASK_NOT_ACTIVE")
    if handoff.get("loop_id") != loop_id: errors.append("HANDOFF_LOOP_ID_DRIFT")
    if task_id not in set(handoff.get("active",[])): errors.append("HANDOFF_CURRENT_TASK_DRIFT")
    if not state.get("next_action"): errors.append("STATE_NEXT_ACTION_MISSING")
    if not handoff.get("next_action"): errors.append("HANDOFF_NEXT_ACTION_MISSING")

    for rel in ["CURRENT_ITERATION.md","LOOP_STATE.md","HANDOFF.md"]:
        if not contains(api/rel,loop_id):
            errors.append("HUMAN_LOOP_ID_DRIFT:"+rel)
    for rel in ["NEXT_ACTION.md","LOOP_STATE.md","HANDOFF.md"]:
        if not contains(api/rel,task_id):
            errors.append("HUMAN_CURRENT_TASK_DRIFT:"+rel)

    suivi=front/"SUIVI.md"
    if not suivi.exists(): errors.append("GLOBAL_SUIVI_MISSING")
    elif "POINT DE REPRISE COURANT" not in suivi.read_text(encoding="utf-8"):
        errors.append("GLOBAL_SUIVI_CHECKPOINT_MISSING")

    # The startup gates must stay mirrored in API authorities.
    markers=[
        "CONTEXT_RECONSTRUCTION_BEFORE_WORK = REQUIRED",
        "CROSS_REPO_DISCOVERY = REQUIRED",
        "NO_BLIND_WORK = REQUIRED",
    ]
    for rel in ["00_START_HERE.md","GOVERNANCE.md","AGENTS.md","LOOP_ENGINEERING.md"]:
        text=(api/rel).read_text(encoding="utf-8")
        for marker in markers:
            if marker not in text: errors.append("STARTUP_GATE_DRIFT:"+rel+":"+marker)

    result={
        "schema_version":"1.0.0",
        "project_uid":"CS-AFRICAFUNDS-001",
        "loop_id":loop_id,
        "current_task_id":task_id,
        "state_registry_coherence":"PASS" if not errors else "FAIL",
        "errors":errors,
        "global_suivi_present":suivi.exists(),
        "conversation_memory_required":False,
    }
    Path(a.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2,ensure_ascii=False))
    raise SystemExit(1 if errors else 0)

if __name__=="__main__":
    main()
