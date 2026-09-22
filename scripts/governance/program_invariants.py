#!/usr/bin/env python3
"""AfricaFunds Programme Director invariant / anti-regression contract.

This validator enforces already-existing governance invariants. It creates no
authority and performs no mutation.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

PROJECT_UID = "CS-AFRICAFUNDS-001"
BRANCH = "claude/code-review-improvements-ikvuj"
QUEUE = ".governance/loop/task-queue.json"
STATE = ".governance/loop/state.json"
HANDOFF = ".governance/loop/handoff.json"
EVIDENCE = ".governance/knowledge/evidence.json"

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def require(errors, condition, code):
    if not condition:
        errors.append(code)

def contains(path: Path, token: str):
    return token in path.read_text(encoding="utf-8", errors="replace")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()

    project=load(api/".governance/project.json")
    queue=load(api/QUEUE)
    state=load(api/STATE)
    handoff=load(api/HANDOFF)
    evidence=load(api/EVIDENCE)
    errors=[]
    warnings=[]

    # Product identity / FUND_STATE invariants.
    require(errors, project.get("project_uid")==PROJECT_UID, "PROJECT_UID_DRIFT")
    require(errors, project.get("project_name")=="AfricaFunds", "PROJECT_NAME_DRIFT")
    require(errors, project.get("canonical_branch")==BRANCH, "CANONICAL_BRANCH_DRIFT")
    require(errors, project.get("project_kind")=="MULTI_REPOSITORY_APPLICATION", "PROJECT_KIND_DRIFT")
    repos=project.get("repositories") or []
    roles={x.get("role"):x.get("full_name") for x in repos}
    require(errors, roles.get("API")=="Wealthtechinnovations/api_opcv", "API_REPOSITORY_DRIFT")
    require(errors, roles.get("FRONTEND")=="Wealthtechinnovations/front_end_opcvm", "FRONTEND_REPOSITORY_DRIFT")
    require(errors, len(repos)==2, "ONE_PRODUCT_TWO_REPOSITORIES_DRIFT")
    require(errors, project.get("state_model")=="FUND_STATE", "FUND_STATE_MODEL_DRIFT")
    require(
        errors,
        project.get("state_fields")==["API_SHA","FRONTEND_SHA","SUIVI_CHECKPOINT","PRODUCTION_ATTESTATION"],
        "FUND_STATE_FIELDS_DRIFT",
    )
    require(errors, project.get("global_checkpoint_repository")=="Wealthtechinnovations/front_end_opcvm", "GLOBAL_CHECKPOINT_REPOSITORY_DRIFT")
    require(errors, project.get("global_checkpoint_file")=="SUIVI.md", "GLOBAL_CHECKPOINT_FILE_DRIFT")

    # Existing loop authorities remain coherent.
    require(errors, queue.get("active_loop_id")==state.get("loop_id"), "QUEUE_STATE_LOOP_DRIFT")
    require(errors, handoff.get("loop_id")==state.get("loop_id"), "HANDOFF_STATE_LOOP_DRIFT")
    tasks=queue.get("tasks") or []
    task_ids=[x.get("id") for x in tasks]
    require(errors, len(task_ids)==len(set(task_ids)), "DUPLICATE_TASK_IDS")
    task_map={x.get("id"):x for x in tasks if x.get("id")}

    # Machine-readable rules already persisted in state.
    rules=state.get("rules") or {}
    require(errors, rules.get("new_branch_creation")=="FORBIDDEN", "NEW_BRANCH_CREATION_RULE_DRIFT")
    require(errors, rules.get("single_writer")=="REQUIRED", "SINGLE_WRITER_RULE_DRIFT")
    require(errors, rules.get("verify_both_heads_before_write")=="REQUIRED", "VERIFY_BOTH_HEADS_RULE_DRIFT")
    require(errors, rules.get("no_blind_work")=="REQUIRED", "NO_BLIND_WORK_RULE_DRIFT")
    require(errors, rules.get("context_reconstruction_before_work")=="REQUIRED", "CONTEXT_RECONSTRUCTION_RULE_DRIFT")
    require(errors, rules.get("cross_repo_discovery")=="REQUIRED", "CROSS_REPO_DISCOVERY_RULE_DRIFT")

    # Normative prose mirrors cannot silently lose critical invariants.
    gov=api/"GOVERNANCE.md"
    loop=api/"LOOP_ENGINEERING.md"
    source=api/"SOURCE_OF_TRUTH.md"
    start=api/"00_START_HERE.md"
    markers={
        gov:[
            "ONE_PRODUCT_TWO_REPOSITORIES = TRUE",
            "NEW_BRANCH_CREATION = FORBIDDEN",
            "FORCE_PUSH = FORBIDDEN",
            "HISTORY_REWRITE = FORBIDDEN",
            "SINGLE_WRITER = REQUIRED",
            "ZERO_REGRESSION = REQUIRED",
            "CONTEXT_RECONSTRUCTION_BEFORE_WORK = REQUIRED",
            "CROSS_REPO_DISCOVERY = REQUIRED",
            "NO_BLIND_WORK = REQUIRED",
            "GITHUB_TO_S2_DEPLOYMENT_PATH = REQUIRED",
            "UNTRACKED_DELETE_WITHOUT_CLASSIFICATION = FORBIDDEN",
        ],
        loop:[
            "CLAIM_SINGLE_WRITER",
            "REGRESSION_CHECK",
            "CODE_WRITTEN != DONE",
            "DOCUMENT_WRITTEN != DONE",
            "UNKNOWN",
        ],
        source:[
            "FUND_STATE = (API_HEAD, FRONTEND_HEAD, SUIVI_CHECKPOINT, PRODUCTION_ATTESTATION)",
            "front_end_opcvm/SUIVI.md",
            "Une conversation n'est jamais la memoire canonique.",
        ],
        start:[
            "GOVERNANCE.md",
            "SOURCE_OF_TRUTH.md",
            "LOOP_ENGINEERING.md",
        ],
    }
    for path,tokens in markers.items():
        require(errors, path.exists(), "MISSING_AUTHORITY:"+path.name)
        if path.exists():
            for token in tokens:
                require(errors, contains(path,token), "AUTHORITY_MARKER_DRIFT:"+path.name+":"+token)

    # Programme Director is derived and must never become a second queue.
    director=queue.get("programme_director") or {}
    require(errors, director.get("mode")=="DERIVED_READ_ONLY", "PROGRAMME_DIRECTOR_MODE_DRIFT")
    require(errors, director.get("single_queue_authority")==QUEUE, "SECOND_QUEUE_AUTHORITY_DRIFT")
    require(errors, director.get("no_second_queue") is True, "NO_SECOND_QUEUE_DRIFT")
    require(errors, director.get("gap_harvester_task_creation")=="FORBIDDEN_AUTOMATIC", "GAP_HARVESTER_AUTO_TASK_DRIFT")
    require(
        errors,
        director.get("candidate_status")=="DISCOVERED_CANDIDATE_NOT_TASK_UNTIL_VERIFIED_AND_DEDUPED",
        "GAP_CANDIDATE_PROMOTION_RULE_DRIFT",
    )

    claims=queue.get("surface_claims_contract") or {}
    require(errors, claims.get("storage")=="TASK_LOCAL_IN_SINGLE_QUEUE", "SECOND_CLAIM_REGISTRY_DRIFT")
    require(errors, claims.get("no_second_claim_registry") is True, "NO_SECOND_CLAIM_REGISTRY_DRIFT")
    require(errors, claims.get("current_enforcement")=="ADVISORY_ONLY_NO_WRITE_BLOCK", "SURFACE_CLAIM_PREMATURE_ENFORCEMENT")
    require(
        errors,
        claims.get("parallel_certification_rule")=="DEPENDENCY_CHECK_PLUS_NON_OVERLAPPING_ACTIVE_SURFACE_CLAIMS_REQUIRED",
        "PARALLEL_CERTIFICATION_RULE_DRIFT",
    )

    # Operational priority must be reflected by the human next-action projection.
    op_id=state.get("operational_priority_task_id")
    op=task_map.get(op_id)
    require(errors, op is not None, "OPERATIONAL_PRIORITY_TASK_MISSING")
    next_action=(api/"NEXT_ACTION.md").read_text(encoding="utf-8", errors="replace")
    if op:
        require(errors, op_id in next_action, "NEXT_ACTION_OPERATIONAL_TASK_DRIFT")
        phase=op.get("phase")
        if phase:
            require(errors, phase in next_action, "NEXT_ACTION_OPERATIONAL_PHASE_DRIFT")

    # Global SUIVI remains frontend-only operational checkpoint.
    api_suivi=(api/"SUIVI.md").read_text(encoding="utf-8", errors="replace")
    frontend_suivi=(front/"SUIVI.md").read_text(encoding="utf-8", errors="replace")
    require(errors, "front_end_opcvm/SUIVI.md" in api_suivi, "API_SUIVI_POINTER_DRIFT")
    require(errors, "POINT DE REPRISE COURANT" in frontend_suivi, "GLOBAL_SUIVI_CHECKPOINT_MISSING")

    # Critical data dependency order cannot regress.
    t7=task_map.get("AF-OPS-007") or {}
    t8=task_map.get("AF-OPS-008") or {}
    t9=task_map.get("AF-OPS-009") or {}
    require(errors, t7.get("status") is not None, "AF_OPS_007_MISSING")
    require(errors, t9.get("status") is not None, "AF_OPS_009_MISSING")
    deps8=set(t8.get("depends_on") or [])
    require(errors, {"AF-OPS-007","AF-OPS-009"}.issubset(deps8), "DATA_QUALITY_DEPENDENCY_ORDER_DRIFT")
    if t8.get("status")=="DONE" and (
        t7.get("status") not in {"DONE","DONE_WITH_EXTERNAL_GAPS"} or
        t9.get("status") not in {"DONE","DONE_WITH_EXTERNAL_GAPS"}
    ):
        errors.append("DERIVED_PERFORMANCE_CLOSED_BEFORE_UPSTREAM_DATA")

    # Allocation live certification must remain gated by data-quality dependencies.
    t14=task_map.get("AF-TASK-014") or {}
    if t14.get("status")=="DONE_WITH_EXTERNAL_GAPS":
        text_blob=" ".join([
            str(t14.get("next_action","")),
            " ".join(t14.get("definition_of_done") or []),
        ])
        require(
            errors,
            all(x in text_blob for x in ("AF-OPS-007","AF-OPS-008","AF-OPS-009")),
            "ALLOCATION_LIVE_DATA_GATE_DRIFT",
        )

    # Evidence ids are append-only identifiers: at minimum they must remain unique.
    evidence_items=evidence.get("evidence") or evidence.get("items") or []
    evidence_ids=[x.get("id") for x in evidence_items]
    require(errors, len(evidence_ids)==len(set(evidence_ids)), "DUPLICATE_EVIDENCE_IDS")
    referenced=[]
    for task in tasks:
        referenced.extend(task.get("evidence_refs") or [])
    missing_refs=sorted({x for x in referenced if x not in set(evidence_ids)})
    require(errors, not missing_refs, "TASK_EVIDENCE_REF_MISSING")
    if missing_refs:
        warnings.append({"missing_evidence_refs":missing_refs})

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"HARD_FAIL_EXISTING_INVARIANTS_ONLY",
        "authority":"EXISTING_GOVERNANCE_DERIVED_VALIDATOR",
        "checked_invariants":{
            "one_product_two_repositories":True,
            "fund_state_tuple":True,
            "single_queue":True,
            "single_writer":True,
            "no_new_branch":True,
            "no_force_push_history_rewrite":True,
            "context_reconstruction":True,
            "next_action_projection":True,
            "global_suivi_frontend":True,
            "data_quality_dependency_order":True,
            "allocation_live_data_gate":True,
            "evidence_id_uniqueness":True,
            "surface_claim_no_second_registry":True,
        },
        "operational_priority":{
            "task_id":op_id,
            "phase":op.get("phase") if op else None,
            "status":op.get("status") if op else None,
        },
        "error_count":len(errors),
        "warning_count":len(warnings),
        "errors":errors,
        "warnings":warnings,
        "integrity":"PASS" if not errors else "FAIL",
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(1 if errors else 0)

if __name__=="__main__":
    main()
