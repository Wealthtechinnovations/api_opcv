#!/usr/bin/env python3
"""AfricaFunds multi-agent surface-claim validator.

Read-only and observe-only by default. Claims, when present, live inside the
existing task objects in .governance/loop/task-queue.json. No second lock or
claim registry is created.
"""
from __future__ import annotations

import argparse
import json
import re
from itertools import combinations
from pathlib import Path

PROJECT_UID = "CS-AFRICAFUNDS-001"
WRITE_MODES = {
    "GOVERNED_CODE_CHANGE",
    "GOVERNED_CODE_OR_DATA_CHANGE_AFTER_DEPENDENCIES",
    "GOV006_DEPLOY",
}

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def static_prefix(pattern: str) -> str:
    p = str(pattern or "").strip().replace("\\", "/").lstrip("./")
    m = re.search(r"[*?[]", p)
    if m:
        p = p[:m.start()]
    return p.rstrip("/")

def overlaps(a: str, b: str) -> bool:
    pa, pb = static_prefix(a), static_prefix(b)
    if not pa or not pb:
        return True
    if pa == pb:
        return True
    return pa.startswith(pb + "/") or pb.startswith(pa + "/")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    project=load(api/".governance/project.json")
    queue=load(api/".governance/loop/task-queue.json")

    if project.get("project_uid") != PROJECT_UID:
        raise SystemExit("PROJECT_UID_DRIFT")

    active=[]
    advisory=[]
    errors=[]

    for task in queue.get("tasks",[]):
        tid=task.get("id")
        claim=task.get("claim") or {}
        surfaces=task.get("touched_surfaces") or claim.get("touched_surfaces") or []
        if claim.get("status") == "ACTIVE":
            if not claim.get("owner"):
                errors.append({"task_id":tid,"error":"ACTIVE_CLAIM_OWNER_MISSING"})
            if not claim.get("claimed_at"):
                errors.append({"task_id":tid,"error":"ACTIVE_CLAIM_TIME_MISSING"})
            if not claim.get("base_api_sha") or not claim.get("base_frontend_sha"):
                errors.append({"task_id":tid,"error":"ACTIVE_CLAIM_BASE_HEADS_MISSING"})
            if not surfaces:
                errors.append({"task_id":tid,"error":"ACTIVE_CLAIM_SURFACES_MISSING"})
            active.append({
                "task_id":tid,
                "owner":claim.get("owner"),
                "claimed_at":claim.get("claimed_at"),
                "base_api_sha":claim.get("base_api_sha"),
                "base_frontend_sha":claim.get("base_frontend_sha"),
                "repository_roles":claim.get("repository_roles") or [],
                "touched_surfaces":surfaces,
            })
        elif task.get("execution_mode") in WRITE_MODES and task.get("status") in {"OPEN","READY","IN_PROGRESS"}:
            advisory.append({
                "task_id":tid,
                "advisory":"WRITE_CAPABLE_TASK_HAS_NO_ACTIVE_SURFACE_CLAIM",
            })

    conflicts=[]
    for left,right in combinations(active,2):
        roles_l=set(left.get("repository_roles") or ["API","FRONTEND"])
        roles_r=set(right.get("repository_roles") or ["API","FRONTEND"])
        if not roles_l.intersection(roles_r):
            continue
        pairs=[]
        for a_surface in left["touched_surfaces"]:
            for b_surface in right["touched_surfaces"]:
                if overlaps(a_surface,b_surface):
                    pairs.append({"left":a_surface,"right":b_surface})
        if pairs:
            conflicts.append({
                "left_task":left["task_id"],
                "right_task":right["task_id"],
                "overlapping_surfaces":pairs,
            })

    certified_parallel=[]
    for left,right in combinations(active,2):
        if any(
            c["left_task"] in {left["task_id"],right["task_id"]} and
            c["right_task"] in {left["task_id"],right["task_id"]}
            for c in conflicts
        ):
            continue
        certified_parallel.append([left["task_id"],right["task_id"]])

    contract=queue.get("surface_claims_contract") or {}
    mode=contract.get("mode","OBSERVE_ONLY")

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":mode,
        "storage":"TASK_LOCAL_IN_SINGLE_QUEUE",
        "second_claim_registry_created":False,
        "active_claims":active,
        "active_claim_count":len(active),
        "conflicts":conflicts,
        "conflict_count":len(conflicts),
        "surface_certified_parallel_pairs":certified_parallel,
        "advisories":advisory,
        "errors":errors,
        "integrity":"PASS" if not errors and not conflicts else "FAIL",
        "enforcement":(
            "ADVISORY_ONLY_NO_WRITE_BLOCK"
            if mode=="OBSERVE_ONLY"
            else "QUEUE_CONTRACT_ENFORCEMENT"
        ),
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(1 if errors or conflicts else 0)

if __name__=="__main__":
    main()
