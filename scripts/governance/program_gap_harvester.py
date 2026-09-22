#!/usr/bin/env python3
"""AfricaFunds Gap Harvester — read-only discovery surface.

This tool NEVER creates tasks. It inventories implementation surfaces and
emits candidate gaps that must be deduplicated against the single governed
queue before any task creation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

PROJECT_UID = "CS-AFRICAFUNDS-001"
TEXT_EXTENSIONS = {".js",".jsx",".ts",".tsx",".py",".sh",".sql",".yml",".yaml",".json",".md"}
MARKER_EXTENSIONS = {".js",".jsx",".ts",".tsx",".py",".sh",".sql",".yml",".yaml"}
EXCLUDED_PARTS = {".git","node_modules","dist","build","coverage",".cache",".next","vendor"}
MARKER = re.compile(r"\b(TODO|FIXME|HACK|XXX)\b[:\s-]*(.*)", re.IGNORECASE)

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def iter_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if any(part in EXCLUDED_PARTS for part in p.parts):
            continue
        if p.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        yield p

def rel(root: Path, p: Path):
    try:
        return str(p.relative_to(root))
    except Exception:
        return str(p)

def inventory(root: Path, role: str):
    files=list(iter_files(root))
    paths=[rel(root,p) for p in files]

    def count(pred):
        return sum(1 for x in paths if pred(x.lower()))

    return {
        "role": role,
        "text_files_scanned": len(files),
        "routes": count(lambda x: "/routes/" in "/" + x or x.startswith("src/routes/")),
        "services": count(lambda x: "/services/" in "/" + x or x.startswith("src/services/")),
        "cron_files": count(lambda x: "cron" in x and (x.endswith(".sh") or x.endswith(".js") or x.endswith(".py"))),
        "collector_like_files": count(lambda x: any(k in x for k in ("scrap","collector","import","extract"))),
        "workflow_files": count(lambda x: x.startswith(".github/workflows/")),
        "test_files": count(lambda x: any(k in x for k in ("/test","/tests/","spec.","test."))),
        "migration_schema_files": count(lambda x: any(k in x for k in ("migration","schema","prisma")) or x.endswith(".sql")),
        "frontend_pages": count(lambda x: role=="FRONTEND" and any(k in x for k in ("/pages/","page.","views/"))),
        "frontend_components": count(lambda x: role=="FRONTEND" and "/components/" in "/" + x),
    }

def queue_text(queue):
    chunks=[]
    for t in queue.get("tasks",[]):
        chunks.append(" ".join([
            str(t.get("id","")),
            str(t.get("title","")),
            str(t.get("next_action","")),
            " ".join(t.get("requirements",[]) or []),
        ]).lower())
    return "\n".join(chunks)

def keyword_match(text, qtext):
    words=[w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ0-9_]{4,}", text)]
    stop={"todo","fixme","hack","this","that","avec","pour","dans","sans","from","when","should","must","faire","mettre","ajouter"}
    words=[w for w in words if w not in stop]
    if not words:
        return []
    hits=[]
    for t in qtext.splitlines():
        score=sum(1 for w in set(words) if w in t)
        if score >= 2:
            tid=t.split(" ",1)[0]
            if tid.startswith("af-"):
                hits.append(tid.upper())
    return sorted(set(hits))[:10]

def harvest(root: Path, role: str, qtext: str):
    rows=[]
    for p in iter_files(root):
        if p.suffix.lower() not in MARKER_EXTENSIONS:
            continue
        try:
            txt=p.read_text(encoding="utf-8",errors="ignore")
        except Exception:
            continue
        for n,line in enumerate(txt.splitlines(),1):
            m=MARKER.search(line)
            if not m:
                continue
            tail=(m.group(2) or "").strip()
            summary=(m.group(1).upper()+(": "+tail if tail else "")).strip()
            rp=rel(root,p)
            fingerprint=hashlib.sha256(f"{role}:{rp}:{n}:{summary}".encode()).hexdigest()[:16]
            rows.append({
                "candidate_id":"GAP-CAND-"+fingerprint,
                "status":"DISCOVERED_CANDIDATE_NOT_TASK",
                "repository_role":role,
                "path":rp,
                "line":n,
                "marker":m.group(1).upper(),
                "summary":summary[:500],
                "possible_existing_task_refs":keyword_match(summary,qtext),
                "requires_dedup_before_queue_write":True,
            })
    return rows

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

    if project.get("project_uid") != PROJECT_UID:
        raise SystemExit("PROJECT_UID_DRIFT")

    qtext=queue_text(queue)
    candidates=harvest(api,"API",qtext)+harvest(front,"FRONTEND",qtext)
    candidates.sort(key=lambda x:(x["repository_role"],x["path"],x["line"]))

    matched=sum(1 for x in candidates if x["possible_existing_task_refs"])
    unmatched=len(candidates)-matched

    result={
        "schema_version":"0.1.0",
        "project_uid":PROJECT_UID,
        "mode":"READ_ONLY_DISCOVERY",
        "task_creation_performed":False,
        "single_queue_authority":".governance/loop/task-queue.json",
        "inventory":[inventory(api,"API"),inventory(front,"FRONTEND")],
        "candidate_count":len(candidates),
        "candidate_with_possible_existing_task":matched,
        "candidate_without_possible_existing_task":unmatched,
        "candidates":candidates[:1000],
        "next_rule":"Every candidate must be verified and deduplicated before attaching to an existing task or creating a task in the single queue.",
    }

    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
