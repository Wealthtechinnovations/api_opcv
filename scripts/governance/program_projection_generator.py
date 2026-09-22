#!/usr/bin/env python3
"""AfricaFunds deterministic human-projection generator.

OBSERVE-ONLY: generates candidate managed blocks from structured authorities.
It NEVER writes repository files. Historical prose is outside its scope.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

PROJECT_UID="CS-AFRICAFUNDS-001"
BEGIN="<!-- PROGRAMME_DIRECTOR:BEGIN -->"
END="<!-- PROGRAMME_DIRECTOR:END -->"

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def digest(value: str):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def block(title: str, rows: list[tuple[str,str]]):
    lines=[BEGIN,f"### {title}",""]
    for key,value in rows:
        clean=str(value if value is not None else "UNKNOWN").replace("\n"," ").strip()
        lines.append(f"- {key}: `{clean}`")
    lines.extend(["",END])
    return "\n".join(lines)

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

    programme_tasks=[
        t for t in queue.get("tasks",[])
        if t.get("program")=="PROGRAMME_DIRECTOR" and t.get("status")=="IN_PROGRESS"
    ]
    programme_tasks.sort(key=lambda t:t.get("id",""))
    programme=programme_tasks[-1] if programme_tasks else {}

    active_claims=sorted(
        t.get("id") for t in queue.get("tasks",[])
        if (t.get("claim") or {}).get("status")=="ACTIVE" and t.get("id")
    )

    director=queue.get("programme_director") or {}
    claims=queue.get("surface_claims_contract") or {}

    snapshot={
        "project_uid":PROJECT_UID,
        "loop_id":state.get("loop_id"),
        "governance_current_task_id":state.get("current_task_id"),
        "operational_priority_task_id":op_id,
        "operational_status":op.get("status"),
        "operational_phase":op.get("phase"),
        "operational_next_action":op.get("next_action"),
        "programme_task_id":programme.get("id"),
        "programme_status":programme.get("status"),
        "programme_phase":programme.get("phase"),
        "programme_next_action":programme.get("next_action"),
        "anti_regression_contract":director.get("anti_regression_contract"),
        "projection_drift_contract":director.get("projection_drift_contract"),
        "single_queue_authority":director.get("single_queue_authority"),
        "surface_claim_mode":claims.get("mode"),
        "surface_claim_enforcement":claims.get("current_enforcement"),
        "active_claims":active_claims,
        "handoff_next_action":handoff.get("next_action"),
        "latest_programme_evidence":director.get("projection_writeback_simulation_evidence") or director.get("projection_generator_latest_evidence") or director.get("projection_drift_latest_evidence") or director.get("anti_regression_latest_evidence") or director.get("latest_evidence_ref"),
    }

    generated={
        "NEXT_ACTION.md":block("Projection gérée — prochaine action",[
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("status",snapshot["operational_status"]),
            ("phase",snapshot["operational_phase"]),
            ("next_action",snapshot["operational_next_action"]),
            ("anti_regression",snapshot["anti_regression_contract"]),
        ]),
        "CURRENT_ITERATION.md":block("Projection gérée — itération courante",[
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("operational_phase",snapshot["operational_phase"]),
            ("programme_task",snapshot["programme_task_id"]),
            ("programme_status",snapshot["programme_status"]),
            ("programme_phase",snapshot["programme_phase"]),
            ("active_claims",", ".join(snapshot["active_claims"]) or "NONE"),
        ]),
        "LOOP_STATE.md":block("Projection gérée — état de boucle",[
            ("loop_id",snapshot["loop_id"]),
            ("governance_current_task",snapshot["governance_current_task_id"]),
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("operational_phase",snapshot["operational_phase"]),
            ("programme_task",snapshot["programme_task_id"]),
        ]),
        "HANDOFF.md":block("Projection gérée — handoff",[
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("operational_phase",snapshot["operational_phase"]),
            ("programme_task",snapshot["programme_task_id"]),
            ("active_claims",", ".join(snapshot["active_claims"]) or "NONE"),
            ("handoff_next_action",snapshot["handoff_next_action"]),
        ]),
        "STATUS.md":block("Projection gérée — statut",[
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("operational_phase",snapshot["operational_phase"]),
            ("programme_task",snapshot["programme_task_id"]),
            ("anti_regression",snapshot["anti_regression_contract"]),
            ("projection_drift",snapshot["projection_drift_contract"]),
            ("claim_enforcement",snapshot["surface_claim_enforcement"]),
        ]),
        "SUIVI.md":block("Projection gérée — checkpoint global",[
            ("project_uid",snapshot["project_uid"]),
            ("operational_priority",snapshot["operational_priority_task_id"]),
            ("operational_phase",snapshot["operational_phase"]),
            ("programme_task",snapshot["programme_task_id"]),
            ("programme_phase",snapshot["programme_phase"]),
            ("active_claims",", ".join(snapshot["active_claims"]) or "NONE"),
            ("latest_programme_evidence",snapshot["latest_programme_evidence"]),
        ]),
    }

    roots={
        "NEXT_ACTION.md":api,
        "CURRENT_ITERATION.md":api,
        "LOOP_STATE.md":api,
        "HANDOFF.md":api,
        "STATUS.md":api,
        "SUIVI.md":front,
    }

    comparisons=[]
    for path,candidate in generated.items():
        current=(roots[path]/path).read_text(encoding="utf-8",errors="replace")
        has_begin=BEGIN in current
        has_end=END in current
        current_block_present=candidate in current
        comparisons.append({
            "path":path,
            "candidate_sha256":digest(candidate),
            "managed_markers_present":has_begin and has_end,
            "exact_candidate_present":current_block_present,
            "writeback_candidate":not current_block_present,
        })

    canonical=json.dumps(snapshot,ensure_ascii=False,sort_keys=True,separators=(",",":"))
    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"GENERATOR_OBSERVE_ONLY",
        "repository_write_performed":False,
        "historical_sections_in_scope":False,
        "managed_begin_marker":BEGIN,
        "managed_end_marker":END,
        "input_snapshot":snapshot,
        "input_sha256":digest(canonical),
        "generated_blocks":generated,
        "comparisons":comparisons,
        "writeback_candidate_count":sum(1 for x in comparisons if x["writeback_candidate"]),
        "exact_present_count":sum(1 for x in comparisons if x["exact_candidate_present"]),
        "next_rule":"Prove byte-for-byte determinism on repeated runs, then insert/update only managed blocks behind a separate governed write-back gate.",
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2))

if __name__=="__main__":
    main()
