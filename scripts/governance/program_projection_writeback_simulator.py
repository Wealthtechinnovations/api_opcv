#!/usr/bin/env python3
"""Simulate managed projection write-back without mutating repositories.

The simulator consumes the observe-only projection-generator artifact, applies
each managed block to an in-memory copy, proves that content outside the block
is preserved, and applies the same block a second time to prove idempotence.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
from pathlib import Path

PROJECT_UID="CS-AFRICAFUNDS-001"

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def sha(value: str):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def insert_after_title(text: str, candidate: str):
    lines=text.splitlines(keepends=True)
    if not lines:
        return candidate+"\n", "", ""
    first=lines[0]
    prefix=first
    rest="".join(lines[1:])
    separator="" if prefix.endswith("\n\n") else "\n"
    proposed=prefix+separator+candidate+"\n\n"+rest.lstrip("\n")
    return proposed,prefix,rest.lstrip("\n")

def apply_managed(text: str, candidate: str, begin: str, end: str):
    begin_count=text.count(begin)
    end_count=text.count(end)

    if begin_count==0 and end_count==0:
        proposed,prefix,suffix=insert_after_title(text,candidate)
        mode="INSERT"
        outside_preserved=proposed.startswith(prefix) and proposed.endswith(suffix)
        return proposed,mode,outside_preserved

    if begin_count!=1 or end_count!=1:
        raise ValueError(f"AMBIGUOUS_MANAGED_MARKERS begin={begin_count} end={end_count}")

    s=text.index(begin)
    e=text.index(end,s)+len(end)
    prefix=text[:s]
    suffix=text[e:]
    proposed=prefix+candidate+suffix
    outside_preserved=(proposed[:len(prefix)]==prefix and proposed.endswith(suffix))
    return proposed,"REPLACE",outside_preserved

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--generator-json",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()
    generator=load(Path(a.generator_json))

    if generator.get("project_uid")!=PROJECT_UID:
        raise SystemExit("PROJECT_UID_DRIFT")
    if generator.get("mode")!="GENERATOR_OBSERVE_ONLY":
        raise SystemExit("GENERATOR_MODE_NOT_OBSERVE_ONLY")
    if generator.get("repository_write_performed") is not False:
        raise SystemExit("GENERATOR_WRITE_FLAG_UNSAFE")

    begin=generator.get("managed_begin_marker")
    end=generator.get("managed_end_marker")
    blocks=generator.get("generated_blocks") or {}
    roots={
        "NEXT_ACTION.md":api,
        "CURRENT_ITERATION.md":api,
        "LOOP_STATE.md":api,
        "HANDOFF.md":api,
        "STATUS.md":api,
        "SUIVI.md":front,
    }

    rows=[]
    errors=[]
    for path,candidate in blocks.items():
        if path not in roots:
            errors.append({"path":path,"error":"UNEXPECTED_PROJECTION_PATH"})
            continue
        current=(roots[path]/path).read_text(encoding="utf-8",errors="replace")
        try:
            proposed,mode,outside_ok=apply_managed(current,candidate,begin,end)
            second,mode2,outside_ok2=apply_managed(proposed,candidate,begin,end)
        except Exception as exc:
            errors.append({"path":path,"error":str(exc)})
            continue

        diff=list(difflib.unified_diff(
            current.splitlines(),
            proposed.splitlines(),
            fromfile=path+":current",
            tofile=path+":simulated",
            lineterm="",
        ))
        added=sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
        removed=sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))

        marker_ok=(proposed.count(begin)==1 and proposed.count(end)==1)
        idempotent=(proposed==second and mode2=="REPLACE")
        row={
            "path":path,
            "mode":mode,
            "current_sha256":sha(current),
            "proposed_sha256":sha(proposed),
            "second_apply_sha256":sha(second),
            "managed_marker_count_ok":marker_ok,
            "outside_managed_content_preserved":outside_ok and outside_ok2,
            "idempotent_second_apply":idempotent,
            "diff_added_lines":added,
            "diff_removed_lines":removed,
            "diff_total_changed_lines":added+removed,
            "diff_preview":diff[:80],
        }
        if not marker_ok:
            errors.append({"path":path,"error":"MANAGED_MARKER_COUNT_INVALID"})
        if not row["outside_managed_content_preserved"]:
            errors.append({"path":path,"error":"OUTSIDE_MANAGED_CONTENT_CHANGED"})
        if not idempotent:
            errors.append({"path":path,"error":"SECOND_APPLY_NOT_IDEMPOTENT"})
        rows.append(row)

    expected=set(roots)
    actual=set(blocks)
    if actual!=expected:
        errors.append({
            "error":"PROJECTION_PATH_SET_DRIFT",
            "expected":sorted(expected),
            "actual":sorted(actual),
        })

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"WRITEBACK_SIMULATION_ONLY",
        "repository_write_performed":False,
        "generator_input_sha256":generator.get("input_sha256"),
        "projection_count":len(rows),
        "all_outside_content_preserved":all(x["outside_managed_content_preserved"] for x in rows) and len(rows)==6,
        "all_second_apply_idempotent":all(x["idempotent_second_apply"] for x in rows) and len(rows)==6,
        "all_marker_counts_valid":all(x["managed_marker_count_ok"] for x in rows) and len(rows)==6,
        "rows":rows,
        "error_count":len(errors),
        "errors":errors,
        "integrity":"PASS" if not errors and len(rows)==6 else "FAIL",
        "next_rule":"No Git write-back is authorized by this simulation. A separate governed task/gate must explicitly authorize insertion of managed blocks.",
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2))
    raise SystemExit(1 if result["integrity"]!="PASS" else 0)

if __name__=="__main__":
    main()
