#!/usr/bin/env python3
"""Pure task-local lease/fencing proposals for the existing AfricaFunds queue.

Not a lock server, scheduler, credential source or live writer. A trusted
execution boundary must supply identity, clock, current heads and atomic
publication against the exact observed API ref. Legacy claims are never
silently expired or adopted. A proposal alone grants no write permission.
"""
from __future__ import annotations

from copy import deepcopy
from fnmatch import fnmatchcase
import hashlib
import json
import re

UID = "CS-AFRICAFUNDS-001"
ROLES = {"API", "FRONTEND"}
OPEN = {"OPEN", "READY", "IN_PROGRESS"}
QUEUE = ".governance/loop/task-queue.json"


def require(condition, code):
    if not condition:
        raise ValueError(code)


def digest(queue):
    return hashlib.sha256(json.dumps(queue, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":")).encode()).hexdigest()


def validate_heads(heads):
    require(isinstance(heads, dict) and set(heads) == ROLES, "HEAD_TUPLE_REQUIRED")
    require(all(isinstance(s,str) and re.fullmatch(r"[0-9a-f]{40}",s) for s in heads.values()), "INVALID_HEAD")


def path_pattern(value):
    require(isinstance(value,str) and value and not value.startswith("/") and
            "\\" not in value and all(p not in ("",".","..") for p in value.split("/")),
            "INVALID_SURFACE")
    return value


def scope(task):
    claim=task.get("claim") or {}
    paths=task.get("touched_surfaces") or claim.get("touched_surfaces") or []
    roles=task.get("repository_roles") or claim.get("repository_roles") or []
    require(isinstance(paths,list) and paths and isinstance(roles,list) and roles and
            set(roles) <= ROLES, "SCOPE_UNDECLARED")
    return set(roles), [path_pattern(p) for p in paths]


def prefix(path):
    return re.split(r"[*?\[]",path,maxsplit=1)[0]


def overlap(a,b):
    # Conservative: wildcard prefixes that can intersect block admission.
    pa,pb=prefix(a),prefix(b)
    if pa==a and pb==b:
        return a==b or a.startswith(b+"/") or b.startswith(a+"/")
    return pa.startswith(pb) or pb.startswith(pa) or pa.rstrip("/")==pb.rstrip("/")


def task_map(queue):
    require(isinstance(queue,dict) and isinstance(queue.get("tasks"),list), "QUEUE_INVALID")
    require((queue.get("surface_claims_contract") or {}).get("storage")=="TASK_LOCAL_IN_SINGLE_QUEUE", "QUEUE_AUTHORITY_DRIFT")
    tasks=queue["tasks"]
    require(all(isinstance(t,dict) and isinstance(t.get("id"),str) and t["id"] for t in tasks), "TASK_ID_INVALID")
    out={t["id"]:t for t in tasks}
    require(len(out)==len(tasks),"DUPLICATE_TASK")
    return out


def validate_identity(owner,session):
    require(isinstance(owner,str) and owner.strip() and isinstance(session,str) and
            re.fullmatch(r"[A-Za-z0-9_.:-]{8,128}",session), "IDENTITY_REQUIRED")


def validate_time(now,ttl=None):
    require(type(now) is int and now>=0,"TRUSTED_CLOCK_REQUIRED")
    if ttl is not None:
        require(type(ttl) is int and 1<=ttl<=3600,"TTL_OUT_OF_RANGE")


def lease_of(claim):
    lease=claim.get("lease")
    require(isinstance(lease,dict) and lease.get("version")==1 and
            type(lease.get("generation")) is int and lease["generation"]>0 and
            type(lease.get("updated_at")) is int and type(lease.get("expires_at")) is int and
            lease["updated_at"]<=lease["expires_at"],"LEGACY_OR_INVALID_LEASE")
    return lease


def current(queue,expected,task_id):
    require(digest(queue)==expected,"QUEUE_REVISION_MISMATCH")
    tasks=task_map(queue)
    require(task_id in tasks,"TASK_UNKNOWN")
    return tasks,tasks[task_id]


def authorize(task,tasks):
    require(task.get("status") in OPEN,"TASK_NOT_ADMISSIBLE")
    # Ordinary code only. Other modes, external gates and missing modes fail closed.
    require(task.get("execution_mode")=="GOVERNED_CODE_CHANGE","TASK_MODE_NOT_ADMITTED")
    require(all(tasks.get(d,{}).get("status")=="DONE" for d in task.get("depends_on",[])),"DEPENDENCY_NOT_DONE")


def conflicts(tasks,task):
    roles,paths=scope(task)
    for other in tasks.values():
        if other["id"]==task["id"] or (other.get("claim") or {}).get("status")!="ACTIVE":
            continue
        other_roles,other_paths=scope(other)  # unknown legacy scope blocks
        if roles & other_roles and any(overlap(a,b) for a in paths for b in other_paths):
            raise ValueError("ACTIVE_SCOPE_CONFLICT:"+other["id"])
    return roles,paths


def propose(queue,expected,task_id,action,owner,session,now,heads,ttl=300,
            generation=None,reconciled=False):
    """Return a candidate queue; only the trusted caller may CAS-publish it.
    'reconciled' is a trusted-boundary input, not evidence of reconciliation.
    """
    validate_identity(owner,session)
    validate_time(now,ttl)
    validate_heads(heads)
    tasks,task=current(queue,expected,task_id)
    claim=task.get("claim") or {}
    status=claim.get("status")
    require(status in (None,"ACTIVE","RELEASED"),"CLAIM_STATE_UNKNOWN")
    candidate=deepcopy(queue)
    target=task_map(candidate)[task_id]
    if action in ("acquire","recover"):
        authorize(task,tasks)
        roles,paths=conflicts(tasks,task)
        prior=claim.get("lease")
        if action=="acquire":
            require(status!="ACTIVE","TASK_ALREADY_CLAIMED")
        else:
            require(status=="ACTIVE","RECOVERY_REQUIRES_ACTIVE")
            previous=lease_of(claim)
            require(now>=previous["expires_at"],"LEASE_NOT_EXPIRED")
            require(reconciled is True,"PRIOR_EFFECTS_NOT_RECONCILED")
        if prior is not None:
            previous=lease_of(claim)
            require(now>=previous["updated_at"],"CLOCK_REGRESSION")
            epoch=previous["generation"]+1
        else:
            epoch=1
        target["claim"]={**claim,"owner":owner,"status":"ACTIVE",
                         "claimed_at":__import__("datetime").datetime.fromtimestamp(now,__import__("datetime").timezone.utc).isoformat(),
                         "base_api_sha":heads["API"],"base_frontend_sha":heads["FRONTEND"],
                         "repository_roles":sorted(roles),"touched_surfaces":paths,
                         "lease":{"version":1,"session":session,"generation":epoch,
                                  "updated_at":now,"expires_at":now+ttl}}
    elif action in ("renew","release"):
        fence(queue,expected,task_id,owner,session,generation,now,heads,heads,[])
        lease=target["claim"]["lease"]
        lease["updated_at"]=now
        if action=="renew":
            lease["expires_at"]=max(lease["expires_at"],now+ttl)
        else:
            target["claim"]["status"]="RELEASED"
            target["claim"]["released_at"]=__import__("datetime").datetime.fromtimestamp(now,__import__("datetime").timezone.utc).isoformat()
            lease["expires_at"]=now
    else:
        raise ValueError("UNKNOWN_TRANSITION")
    # Preserve canonical task authority, and maintain existing derived count/IDs.
    active=sorted(t["id"] for t in candidate["tasks"] if (t.get("claim") or {}).get("status")=="ACTIVE")
    contract=candidate["surface_claims_contract"]
    contract["active_claim_count"]=len(active)
    contract["active_claim_task_ids"]=active
    # Other derived summaries/projections must be regenerated before live use.
    return candidate


def fence(queue,expected,task_id,owner,session,generation,now,expected_heads,observed_heads,effects):
    """Fail-closed authorization predicate; must be followed by real CAS.
    effects are exact (repository role, path) pairs, not shell commands.
    """
    validate_identity(owner,session)
    validate_time(now)
    validate_heads(expected_heads)
    validate_heads(observed_heads)
    require(expected_heads==observed_heads,"HEAD_TUPLE_MISMATCH")
    tasks,task=current(queue,expected,task_id)
    authorize(task,tasks)
    roles,patterns=conflicts(tasks,task)
    claim=task.get("claim") or {}
    require(claim.get("status")=="ACTIVE","CLAIM_NOT_ACTIVE")
    lease=lease_of(claim)
    require(claim.get("owner")==owner and lease.get("session")==session and
            type(generation) is int and generation==lease["generation"],"STALE_FENCE_OR_IDENTITY")
    require(lease["updated_at"]<=now<lease["expires_at"],"LEASE_EXPIRED_OR_CLOCK_REGRESSION")
    for role,path in effects:
        path_pattern(path)
        require(prefix(path)==path,"EFFECT_MUST_BE_EXACT")
        require(role in roles and any(fnmatchcase(path,p) for p in patterns),"EFFECT_OUTSIDE_SCOPE")
    return True
