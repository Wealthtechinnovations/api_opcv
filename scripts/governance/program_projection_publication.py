#!/usr/bin/env python3
"""Bounded two-repository publication plan and resumable effect protocol.

No credentials, scheduler, remote API or production operation. A trusted
transport must verify exact candidate objects and implement real non-force
compare-and-swap. GitHub activation is deliberately not implied by local tests.
"""
from __future__ import annotations

from copy import deepcopy
import hashlib
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
