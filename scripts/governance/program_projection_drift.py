#!/usr/bin/env python3
"""AfricaFunds human-projection drift detector.

Read-only. Structured authorities remain task-queue/state/handoff/evidence.
This tool detects when human projections lag behind the current operational
priority or Programme Director state.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

PROJECT_UID="CS-AFRICAFUNDS-001"

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def current_section(text: str, split_markers: list[str]):
    cut=len(text)
    for marker in split_markers:
        i=text.find(marker)
        if i>=0:
            cut=min(cut,i)
    return text[:cut]

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()

    project=load(api/".governance/project.json")
    queue=load(api/".governance/loop/task-queue.json")
    state=load(api/".governance/loop/state.json")
    handoff=load(api/".governance/loop/handoff.json")

    if project.get("project_uid")!=PROJECT_UID:
        raise SystemExit("PROJECT_UID_DRIFT")

    tasks={t.get("id"):t for t in queue.get("tasks",[]) if t.get("id")}
    op_id=state.get("operational_priority_task_id")
    op=tasks.get(op_id) or {}
    op_phase=op.get("phase")
    op_status=op.get("status")

    director=queue.get("programme_director") or {}
    claims=queue.get("surface_claims_contract") or {}

    checks=[]

    def check(name,path,section,required,mode="MUST_MATCH"):
        missing=[token for token in required if token and token not in section]
        checks.append({
            "projection":name,
            "path":str(path),
            "mode":mode,
            "required_tokens":required,
            "missing_tokens":missing,
            "status":"PASS" if not missing else "DRIFT",
        })

    next_text=(api/"NEXT_ACTION.md").read_text(encoding="utf-8",errors="replace")
    check("NEXT_ACTION",api/"NEXT_ACTION.md",next_text,[
        op_id,
        op_phase,
        director.get("anti_regression_contract"),
    ])

    cur_text=(api/"CURRENT_ITERATION.md").read_text(encoding="utf-8",errors="replace")
    cur_current=current_section(cur_text,["### Historique conservé"])
    check("CURRENT_ITERATION",api/"CURRENT_ITERATION.md",cur_current,[op_id,op_phase])

    loop_text=(api/"LOOP_STATE.md").read_text(encoding="utf-8",errors="replace")
    loop_current=current_section(loop_text,["### Historique conservé"])
    check("LOOP_STATE",api/"LOOP_STATE.md",loop_current,[op_id,op_phase])

    handoff_text=(api/"HANDOFF.md").read_text(encoding="utf-8",errors="replace")
    handoff_current=current_section(handoff_text,["## Point de reprise courant — clôture","### Historique conservé"])
    check("HANDOFF",api/"HANDOFF.md",handoff_current,[op_id,op_phase])

    status_text=(api/"STATUS.md").read_text(encoding="utf-8",errors="replace")
    check("STATUS",api/"STATUS.md",status_text,[op_id,op_phase])

    suivi_text=(front/"SUIVI.md").read_text(encoding="utf-8",errors="replace")
    suivi_current=current_section(suivi_text,["\n## POINT DE REPRISE COURANT — 2026-09-22 — AF-OPS-003 RCA resserrée"])
    check("GLOBAL_SUIVI",front/"SUIVI.md",suivi_current,[
        op_id,
        op_phase,
        "AF-EVD-063",
        "active_claim_count = 1",
    ])

    # Machine-readable handoff must agree with the queue before prose is trusted.
    machine=[]
    machine.append({
        "name":"HANDOFF_CURRENT_OPERATIONAL_TASK",
        "status":"PASS" if (handoff.get("resume_contract") or {}).get("current_operational_task")==op_id else "DRIFT"
    })
    machine.append({
        "name":"HANDOFF_OPERATIONAL_STATUS",
        "status":"PASS" if (handoff.get("resume_contract") or {}).get("operational_task_status")==op_phase else "DRIFT"
    })
    machine.append({
        "name":"SURFACE_CLAIM_COUNT",
        "status":"PASS" if claims.get("active_claim_count")==1 else "OBSERVED_DIFFERENCE",
        "declared":claims.get("active_claim_count"),
    })

    drift=[x for x in checks if x["status"]!="PASS"]
    machine_drift=[x for x in machine if x["status"]=="DRIFT"]

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"FAIL_CLOSED_CURRENT_PROJECTIONS",
        "authority":"STRUCTURED_STATE_ONLY_HUMAN_PROJECTIONS_ARE_VIEWS",
        "operational_priority":{
            "task_id":op_id,
            "phase":op_phase,
            "status":op_status,
        },
        "projection_checks":checks,
        "projection_drift_count":len(drift),
        "projection_drifts":drift,
        "machine_checks":machine,
        "machine_drift_count":len(machine_drift),
        "integrity":"PASS" if not machine_drift and not drift else "FAIL",
        "next_rule":"Current human projections are fail-closed against structured authorities; repair drift without rewriting historical sections before merging further governance projection changes.",
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(1 if machine_drift or drift else 0)

if __name__=="__main__":
    main()
