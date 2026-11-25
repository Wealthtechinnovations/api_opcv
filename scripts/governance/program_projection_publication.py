#!/usr/bin/env python3
"""Bounded two-repository publication plan and resumable effect protocol.

No credentials, scheduler, remote API or production operation. A trusted
transport must verify exact candidate objects and implement real non-force
compare-and-swap. GitHub activation is deliberately not implied by local tests.
"""
from __future__ import annotations

from copy import deepcopy
import hashlib
import argparse
import os
from pathlib import Path
import subprocess
import tempfile
import json
import re

UID="CS-AFRICAFUNDS-001"
TASK="AF-TASK-028"
BRANCH="claude/code-review-improvements-ikvuj"
REPOS={"API":"Wealthtechinnovations/api_opcv","FRONTEND":"Wealthtechinnovations/front_end_opcvm"}
PATHS={"API":{"NEXT_ACTION.md","CURRENT_ITERATION.md","LOOP_STATE.md","HANDOFF.md","STATUS.md"},
       "FRONTEND":{"SUIVI.md"}}
BEGIN=b"<!-- PROGRAMME_DIRECTOR:BEGIN -->"
END=b"<!-- PROGRAMME_DIRECTOR:END -->"


def require(ok,code):
    if not ok:
        raise ValueError(code)


def sha(value):
    require(isinstance(value,str) and re.fullmatch(r"[0-9a-f]{40}",value),"INVALID_SHA")
    return value


def digest(obj):
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":")).encode()).hexdigest()


def split_block(data):
    require(isinstance(data,bytes) and data.count(BEGIN)==data.count(END)==1,"INVALID_MARKERS")
    start=data.index(BEGIN); end=data.index(END)+len(END)
    require(start<end-len(END),"INVALID_MARKER_ORDER")
    return data[:start],data[start:end],data[end:]


def verify_change(old,new,expected):
    a,b,c=split_block(old)
    x,y,z=split_block(new)
    require(a==x and c==z,"OUTSIDE_BLOCK_CHANGED")
    require(y==expected,"UNEXPECTED_MANAGED_BLOCK")
    return old!=new


def prepare(heads,candidates,inspect,expected_blocks):
    """inspect(role,base,candidate) returns verified Git parent and file bytes.

    Expected blocks must be independently generated from the canonical
    authorities, never supplied solely by an untrusted worker.
    """
    require(set(heads)==set(candidates)==set(REPOS),"HEAD_TUPLE_REQUIRED")
    require(set(expected_blocks)==set().union(*PATHS.values()),"EXPECTED_BLOCK_SET")
    rows={}
    for role in REPOS:
        base=sha(heads[role]); candidate=sha(candidates[role])
        if candidate==base:
            # Even a no-change proposal must demonstrate all expected blocks.
            observed=inspect(role,base,base)
            require(set(observed["files"])==PATHS[role],"INCOMPLETE_INSPECTION")
            for path,(old,new) in observed["files"].items():
                require(not verify_change(old,new,expected_blocks[path]),"NO_CHANGE_MISMATCH")
        else:
            observed=inspect(role,base,candidate)
            require(observed.get("parents")==[base],"CANDIDATE_NOT_EXACT_CHILD")
            require(set(observed["files"])==PATHS[role],"INCOMPLETE_INSPECTION")
            changes=set(observed.get("changes",[]))
            require(changes and changes<=PATHS[role],"UNAUTHORIZED_DIFF")
            verified=set()
            for path,(old,new) in observed["files"].items():
                if verify_change(old,new,expected_blocks[path]):
                    verified.add(path)
            require(verified==changes,"DIFF_MISMATCH")
        rows[role]={"repository":REPOS[role],"base":base,"candidate":candidate}
    plan={"project":UID,"task":TASK,"branch":BRANCH,"repositories":rows}
    return {**plan,"plan_id":digest(plan)}


def publish(plan,transport,authorize,confirmation,previous=None):
    """Apply through an injected trusted transport, never a force update.

    authorize(plan,observed,role) must validate identity, current lease/fence
    and the immutable candidate proof at the actual write boundary.
    transport.cas(role,old,new) must be atomic and non-force.
    A failed or unknown effect requires reobservation; there is no rollback.
    """
    clean={k:v for k,v in plan.items() if k!="plan_id"}
    require(plan.get("plan_id")==digest(clean),"PLAN_DIGEST_MISMATCH")
    require(plan.get("project")==UID and plan.get("task")==TASK and plan.get("branch")==BRANCH,"PROJECT_DRIFT")
    require(confirmation=="PUBLISH_"+plan["plan_id"],"EXPLICIT_CONFIRMATION_REQUIRED")
    rows=plan["repositories"]
    require(set(rows)==set(REPOS) and all(rows[k]["repository"]==REPOS[k] for k in REPOS),"REPOSITORY_DRIFT")
    base={k:sha(v["base"]) for k,v in rows.items()}
    target={k:sha(v["candidate"]) for k,v in rows.items()}
    observed=transport.heads()
    require(set(observed)==set(REPOS),"HEAD_TUPLE_REQUIRED")
    pending=[k for k in REPOS if base[k]!=target[k]]
    if not pending:
        require(observed==base,"HEAD_DRIFT")
        require(authorize(plan,observed,None) is True,"ADMISSION_REFUSED")
        return {"plan_id":plan["plan_id"],"status":"NO_CHANGE","heads":observed,"effects":[]}
    if observed==target:
        require(previous and previous.get("plan_id")==plan["plan_id"],"UNATTESTED_PRIOR_EFFECT")
        require(authorize(plan,observed,None) is True,"ADMISSION_REFUSED")
        return {"plan_id":plan["plan_id"],"status":"ALREADY_APPLIED","heads":observed,"effects":[]}
    expected=deepcopy(base)
    if observed!=base:
        require(previous and previous.get("plan_id")==plan["plan_id"] and
                previous.get("status")=="PARTIAL_REOBSERVE" and
                previous.get("heads")==observed,"PARTIAL_RECONCILIATION_REQUIRED")
        seen_pending=False
        for role in pending:
            if observed[role]==base[role]:
                seen_pending=True
            else:
                require(not seen_pending and observed[role]==target[role],"HEAD_DRIFT")
            expected[role]=observed[role]
        require(expected==observed,"HEAD_DRIFT")
    effects=[]
    for role in pending:
        if expected[role]==target[role]:
            continue
        current=transport.heads()
        if current!=expected:
            return {"plan_id":plan["plan_id"],"status":"PARTIAL_REOBSERVE","heads":current,"effects":effects}
        if authorize(plan,current,role) is not True:
            return {"plan_id":plan["plan_id"],"status":"PARTIAL_REOBSERVE","heads":current,"effects":effects}
        try:
            accepted=transport.cas(role,expected[role],target[role])
        except Exception:
            accepted=False
        current=transport.heads()
        if not accepted:
            return {"plan_id":plan["plan_id"],"status":"PARTIAL_REOBSERVE","heads":current,"effects":effects}
        expected[role]=target[role]
        effects.append(role)
        if current!=expected:
            return {"plan_id":plan["plan_id"],"status":"PARTIAL_REOBSERVE","heads":current,"effects":effects}
    current=transport.heads()
    return {"plan_id":plan["plan_id"],"status":"APPLIED" if current==target else "PARTIAL_REOBSERVE",
            "heads":current,"effects":effects}


def git_bytes(root,*args,input=None,env=None):
    return subprocess.run(["git","-C",str(root),*args],input=input,env=env,
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout


def git_text(root,*args,**kwargs):
    return git_bytes(root,*args,**kwargs).decode().strip()


def changed_paths(root,*args):
    return {p.decode("utf-8") for p in git_bytes(root,*args,"-z").split(b"\0") if p}


def plan_worktrees(roots,heads,blocks,mode):
    """Prepare exact projection candidates, never move a ref or publish.

    dry-run creates no Git objects. apply-local may create unreferenced
    commits in the isolated checkout, using a temporary index only.
    The artifact is a local preflight, not a portable authorization.
    """
    require(mode in ("dry-run","apply-local"),"MODE_NOT_ADMITTED")
    require(set(roots)==set(heads)==set(REPOS),"HEAD_TUPLE_REQUIRED")
    require(set(blocks)==set().union(*PATHS.values()),"EXPECTED_BLOCK_SET")
    targets={}
    records=[]
    for role,root in roots.items():
        root=Path(root).resolve()
        require(git_text(root,"rev-parse","HEAD")==sha(heads[role]),"LOCAL_HEAD_DRIFT")
        require(not changed_paths(root,"diff","--cached","--name-only"),"STAGED_CHANGE")
        require(not changed_paths(root,"ls-files","--others","--exclude-standard"),"UNTRACKED_CHANGE")
        actual=changed_paths(root,"diff","HEAD","--name-only","--no-renames")
        require(actual<=PATHS[role],"UNAUTHORIZED_DIFF")
        if mode=="dry-run":
            require(not actual,"DIRTY_DRY_RUN")
        modified={}
        for path in sorted(PATHS[role]):
            entry=git_text(root,"ls-tree",heads[role],"--",path)
            meta,name=entry.split("\t",1)
            file_mode,kind,_=meta.split()
            require(name==path and kind=="blob" and file_mode in ("100644","100755"),"UNSAFE_FILE_MODE")
            old=git_bytes(root,"show",heads[role]+":"+path)
            prefix,_,suffix=split_block(old)
            new=prefix+blocks[path]+suffix
            require(verify_change(old,new,blocks[path])==(old!=new),"BLOCK_DIFF_MISMATCH")
            disk=root/path
            require(disk.is_file() and not disk.is_symlink(),"UNSAFE_WORKTREE_FILE")
            require(disk.read_bytes()==(old if mode=="dry-run" else new),"WORKTREE_CONTENT_MISMATCH")
            if old!=new:
                modified[path]=(file_mode,new)
            records.append({"role":role,"path":path,"changed":old!=new,
                            "base_sha256":hashlib.sha256(old).hexdigest(),
                            "proposed_sha256":hashlib.sha256(new).hexdigest()})
        if mode=="apply-local":
            require(actual==set(modified),"WORKTREE_DIFF_MISMATCH")
        targets[role]=heads[role]
        if modified and mode=="apply-local":
            with tempfile.TemporaryDirectory(prefix="af-projection-index-") as td:
                env={**os.environ,"GIT_INDEX_FILE":str(Path(td)/"index"),
                     "GIT_AUTHOR_NAME":"AfricaFunds preflight",
                     "GIT_AUTHOR_EMAIL":"preflight@example.invalid",
                     "GIT_COMMITTER_NAME":"AfricaFunds preflight",
                     "GIT_COMMITTER_EMAIL":"preflight@example.invalid"}
                git_bytes(root,"read-tree",heads[role],env=env)
                for path,(file_mode,new) in modified.items():
                    blob=git_text(root,"hash-object","-w","--stdin",input=new)
                    git_bytes(root,"update-index","--add","--cacheinfo",file_mode+","+blob+","+path,env=env)
                tree=git_text(root,"write-tree",env=env)
                targets[role]=git_text(root,"commit-tree",tree,"-p",heads[role],
                                       input=b"Unpublished governed projection candidate\n",env=env)
        require(git_text(root,"rev-parse","HEAD")==heads[role],"LOCAL_HEAD_MOVED")
    changes=sum(row["changed"] for row in records)
    def inspect(role,base,candidate):
        root=roots[role]
        parent=git_text(root,"rev-list","--parents","-n","1",candidate).split()[1:]
        files={}
        for path in PATHS[role]:
            old_mode=git_text(root,"ls-tree",base,"--",path).split()[0]
            new_mode=git_text(root,"ls-tree",candidate,"--",path).split()[0]
            require(old_mode==new_mode,"FILE_MODE_DRIFT")
            files[path]=(git_bytes(root,"show",base+":"+path),git_bytes(root,"show",candidate+":"+path))
        return {"parents":parent,"changes":changed_paths(root,"diff","--name-only","--no-renames",base,candidate),"files":files}
    plan=None
    if mode=="apply-local" or changes==0:
        plan=prepare(heads,targets,inspect,blocks)
    return {"project":UID,"task":TASK,"mode":mode,
            "status":"NO_CHANGE" if changes==0 else ("PREPARED_LOCAL" if mode=="apply-local" else "CHANGES_REQUIRE_CONFIRMED_LOCAL_APPLY"),
            "changed_count":changes,"candidate_objects_created":sum(targets[k]!=heads[k] for k in REPOS),
            "remote_publication":False,"refs_changed":False,
            "records":records,"plan":plan}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",type=Path,required=True)
    p.add_argument("--frontend-root",type=Path,required=True)
    p.add_argument("--generator-json",type=Path,required=True)
    p.add_argument("--expected-api-sha",required=True)
    p.add_argument("--expected-frontend-sha",required=True)
    p.add_argument("--mode",choices=("dry-run","apply-local"),required=True)
    p.add_argument("--confirmation",default="")
    p.add_argument("--output",type=Path,required=True)
    a=p.parse_args()
    require(a.confirmation==("APPLY_LOCAL_CS-AFRICAFUNDS-001" if a.mode=="apply-local" else ""),"CONFIRMATION_REQUIRED")
    g=json.loads(a.generator_json.read_text(encoding="utf-8"))
    require(g.get("project_uid")==UID and g.get("mode")=="GENERATOR_OBSERVE_ONLY" and
            g.get("repository_write_performed") is False,"GENERATOR_NOT_ADMITTED")
    blocks={k:v.encode("utf-8") for k,v in g["generated_blocks"].items()}
    result=plan_worktrees({"API":a.api_root,"FRONTEND":a.frontend_root},
                          {"API":a.expected_api_sha,"FRONTEND":a.expected_frontend_sha},blocks,a.mode)
    a.output.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print("PUBLICATION_LOCAL_PLAN="+result["status"]+"; candidate_objects="+str(result["candidate_objects_created"])+"; remote_publication=false")


if __name__=="__main__":
    main()
