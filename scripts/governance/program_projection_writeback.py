#!/usr/bin/env python3
"""Governed local write-back engine for Programme Director managed blocks.

Safety properties:
- dry-run by default;
- --apply is explicit;
- exact API + frontend HEAD preconditions are mandatory;
- caller task must own an ACTIVE task-local surface claim;
- only six known projection files are in scope;
- only the unique PROGRAMME_DIRECTOR managed block may change;
- historical/outside content must remain byte-identical;
- this script has no Git push/update-ref/deploy primitive.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PROJECT_UID="CS-AFRICAFUNDS-001"
BEGIN="<!-- PROGRAMME_DIRECTOR:BEGIN -->"
END="<!-- PROGRAMME_DIRECTOR:END -->"
EXPECTED_PATHS={
    "NEXT_ACTION.md":"API",
    "CURRENT_ITERATION.md":"API",
    "LOOP_STATE.md":"API",
    "HANDOFF.md":"API",
    "STATUS.md":"API",
    "SUIVI.md":"FRONTEND",
}

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def sha(value: str):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def git_head(root: Path):
    return subprocess.check_output(
        ["git","-C",str(root),"rev-parse","HEAD"],text=True
    ).strip()

def static_prefix(pattern: str):
    p=str(pattern or "").strip().replace("\\","/").lstrip("./")
    m=re.search(r"[*?[]",p)
    if m:
        p=p[:m.start()]
    return p.rstrip("/")

def overlaps(a: str,b: str):
    pa,pb=static_prefix(a),static_prefix(b)
    if not pa or not pb:
        return True
    return pa==pb or pa.startswith(pb+"/") or pb.startswith(pa+"/")

def insert_after_title(text: str,candidate: str):
    lines=text.splitlines(keepends=True)
    if not lines:
        return candidate+"\n","",""
    first=lines[0]
    prefix=first
    rest="".join(lines[1:]).lstrip("\n")
    separator="" if prefix.endswith("\n\n") else "\n"
    return prefix+separator+candidate+"\n\n"+rest,prefix,rest

def apply_managed(text: str,candidate: str):
    bc=text.count(BEGIN)
    ec=text.count(END)
    if bc==0 and ec==0:
        proposed,prefix,suffix=insert_after_title(text,candidate)
        return proposed,"INSERT",prefix,suffix
    if bc!=1 or ec!=1:
        raise ValueError(f"AMBIGUOUS_MANAGED_MARKERS begin={bc} end={ec}")
    s=text.index(BEGIN)
    e=text.index(END,s)+len(END)
    prefix=text[:s]
    suffix=text[e:]
    return prefix+candidate+suffix,"REPLACE",prefix,suffix

def claim_guard(queue: dict,task_id: str):
    tasks={t.get("id"):t for t in queue.get("tasks",[]) if t.get("id")}
    task=tasks.get(task_id)
    if not task:
        raise ValueError("CLAIM_TASK_MISSING")
    claim=task.get("claim") or {}
    if claim.get("status")!="ACTIVE":
        raise ValueError("CLAIM_NOT_ACTIVE")
    if not claim.get("owner") or not claim.get("base_api_sha") or not claim.get("base_frontend_sha"):
        raise ValueError("CLAIM_INCOMPLETE")
    surfaces=task.get("touched_surfaces") or claim.get("touched_surfaces") or []
    if not surfaces:
        raise ValueError("CLAIM_SURFACES_MISSING")

    target_surfaces=[
        "NEXT_ACTION.md","CURRENT_ITERATION.md","LOOP_STATE.md","HANDOFF.md",
        "STATUS.md","SUIVI.md"
    ]
    if not all(any(overlaps(s,t) for s in surfaces) for t in target_surfaces):
        raise ValueError("CLAIM_DOES_NOT_COVER_ALL_PROJECTIONS")

    conflicts=[]
    for other in queue.get("tasks",[]):
        if other.get("id")==task_id:
            continue
        oc=other.get("claim") or {}
        if oc.get("status")!="ACTIVE":
            continue
        other_surfaces=other.get("touched_surfaces") or oc.get("touched_surfaces") or []
        pairs=[]
        for a in target_surfaces:
            for b in other_surfaces:
                if overlaps(a,b):
                    pairs.append({"target":a,"other":b})
        if pairs:
            conflicts.append({"task_id":other.get("id"),"pairs":pairs})
    if conflicts:
        raise ValueError("ACTIVE_CLAIM_CONFLICT:"+json.dumps(conflicts,sort_keys=True))
    return {
        "task_id":task_id,
        "owner":claim.get("owner"),
        "claimed_at":claim.get("claimed_at"),
        "surfaces":surfaces,
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--generator-json",required=True)
    p.add_argument("--expected-api-sha",required=True)
    p.add_argument("--expected-frontend-sha",required=True)
    p.add_argument("--task-id",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--apply",action="store_true")
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()
    generator=load(Path(a.generator_json))
    project=load(api/".governance/project.json")
    queue=load(api/".governance/loop/task-queue.json")

    errors=[]
    if project.get("project_uid")!=PROJECT_UID:
        errors.append("PROJECT_UID_DRIFT")
    if generator.get("project_uid")!=PROJECT_UID:
        errors.append("GENERATOR_PROJECT_UID_DRIFT")
    if generator.get("mode")!="GENERATOR_OBSERVE_ONLY":
        errors.append("GENERATOR_MODE_UNSAFE")
    if generator.get("repository_write_performed") is not False:
        errors.append("GENERATOR_WRITE_FLAG_UNSAFE")

    observed_api=git_head(api)
    observed_front=git_head(front)
    if observed_api!=a.expected_api_sha:
        errors.append("API_HEAD_MISMATCH")
    if observed_front!=a.expected_frontend_sha:
        errors.append("FRONTEND_HEAD_MISMATCH")

    claim=None
    try:
        claim=claim_guard(queue,a.task_id)
    except Exception as exc:
        errors.append(str(exc))

    blocks=generator.get("generated_blocks") or {}
    if set(blocks)!=set(EXPECTED_PATHS):
        errors.append("PROJECTION_PATH_SET_DRIFT")

    roots={"API":api,"FRONTEND":front}
    rows=[]
    staged=[]
    if not errors:
        for path in sorted(EXPECTED_PATHS):
            root=roots[EXPECTED_PATHS[path]]
            file_path=root/path
            current=file_path.read_text(encoding="utf-8",errors="replace")
            candidate=blocks[path]
            try:
                proposed,mode,prefix,suffix=apply_managed(current,candidate)
            except Exception as exc:
                errors.append(f"{path}:{exc}")
                continue

            outside_ok=proposed.startswith(prefix) and proposed.endswith(suffix)
            marker_ok=proposed.count(BEGIN)==1 and proposed.count(END)==1
            changed=current!=proposed
            row={
                "path":path,
                "repository_role":EXPECTED_PATHS[path],
                "mode":mode,
                "changed":changed,
                "current_sha256":sha(current),
                "proposed_sha256":sha(proposed),
                "outside_managed_content_preserved":outside_ok,
                "managed_marker_count_ok":marker_ok,
            }
            if not outside_ok:
                errors.append(f"{path}:OUTSIDE_MANAGED_CONTENT_CHANGED")
            if not marker_ok:
                errors.append(f"{path}:MANAGED_MARKER_COUNT_INVALID")
            rows.append(row)
            staged.append((file_path,proposed,changed))

    wrote=[]
    if a.apply and not errors:
        for file_path,proposed,changed in staged:
            if changed:
                file_path.write_text(proposed,encoding="utf-8")
                wrote.append(str(file_path))

    # Re-read after optional local apply. A second identical apply must yield no
    # candidate difference; no Git commit/push is performed here.
    post=[]
    if not errors:
        for path in sorted(EXPECTED_PATHS):
            root=roots[EXPECTED_PATHS[path]]
            current=(root/path).read_text(encoding="utf-8",errors="replace")
            proposed,mode,prefix,suffix=apply_managed(current,blocks[path])
            post.append({
                "path":path,
                "would_change_on_second_apply":current!=proposed,
                "post_sha256":sha(current),
                "second_proposed_sha256":sha(proposed),
                "outside_managed_content_preserved":proposed.startswith(prefix) and proposed.endswith(suffix),
            })

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"APPLY_LOCAL_ONLY" if a.apply else "DRY_RUN_ONLY",
        "repository_git_push_performed":False,
        "runtime_deploy_performed":False,
        "expected_api_sha":a.expected_api_sha,
        "observed_api_sha":observed_api,
        "expected_frontend_sha":a.expected_frontend_sha,
        "observed_frontend_sha":observed_front,
        "task_id":a.task_id,
        "claim":claim,
        "projection_count":len(rows),
        "changed_count":sum(1 for x in rows if x["changed"]),
        "files_written_count":len(wrote),
        "files_written":wrote,
        "rows":rows,
        "post_apply":post,
        "all_second_apply_idempotent":all(not x["would_change_on_second_apply"] for x in post) and len(post)==6,
        "all_outside_content_preserved":all(x["outside_managed_content_preserved"] for x in rows+post) and len(rows)==6 and len(post)==6,
        "all_markers_valid":all(x["managed_marker_count_ok"] for x in rows) and len(rows)==6,
        "errors":errors,
        "error_count":len(errors),
        "integrity":"PASS" if not errors and len(rows)==6 else "FAIL",
    }
    Path(a.output).write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2))
    raise SystemExit(1 if result["integrity"]!="PASS" else 0)

if __name__=="__main__":
    main()
