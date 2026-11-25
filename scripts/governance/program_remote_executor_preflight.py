#!/usr/bin/env python3
"""Observe the actual GitHub Actions runtime and canonical remote references.

No credential export, token creation, write, claim takeover, deployment or
second registry. A runner observation is NOT a trusted writer admission.
"""
from __future__ import annotations
import argparse
from datetime import timezone
from email.utils import parsedate_to_datetime
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

from program_claim_lease import digest, lease_of

UID="CS-AFRICAFUNDS-001"
BRANCH="claude/code-review-improvements-ikvuj"
REPOS={"API":("Wealthtechinnovations/api_opcv",895977310),
       "FRONTEND":("Wealthtechinnovations/front_end_opcvm",895972649)}
OWNER_ID=94637590


def require(ok,code):
    if not ok:
        raise ValueError(code)


def git_head(root):
    return subprocess.check_output(["git","-C",str(root),"rev-parse","HEAD"],text=True).strip()


def observe(get,env,queue,checkout,clock):
    """get supplies actual authenticated GitHub responses and Date headers.

    A workflow actor identifies its triggering account, not the token holder.
    """
    require(env.get("GITHUB_REPOSITORY")==REPOS["API"][0],"RUNNER_REPOSITORY_DRIFT")
    require(env.get("GITHUB_REF")=="refs/heads/"+BRANCH,"RUNNER_BRANCH_DRIFT")
    rid=env.get("GITHUB_RUN_ID","")
    attempt=env.get("GITHUB_RUN_ATTEMPT","")
    require(rid.isdecimal() and attempt.isdecimal(),"RUN_IDENTITY_MISSING")
    require(env.get("GITHUB_SHA")==checkout["API"],"RUNNER_SHA_MISMATCH")
    clocks=[]
    def read(path):
        before=clock()
        data,date=get(path)
        after=clock()
        parsed=parsedate_to_datetime(date)
        require(parsed.tzinfo is not None,"REMOTE_CLOCK_MISSING_ZONE")
        remote=parsed.astimezone(timezone.utc).timestamp()
        require(before<=after and abs(remote-(before+after)/2)<=120,"REMOTE_CLOCK_SKEW")
        clocks.append({"remote_epoch":int(remote),"round_trip_seconds":round(after-before,3)})
        return data
    observed={}
    for role,(repo,ident) in REPOS.items():
        meta=read("/repos/"+repo)
        require(meta.get("id")==ident and meta.get("full_name")==repo and
                (meta.get("owner") or {}).get("id")==OWNER_ID and
                meta.get("default_branch")==BRANCH,"REPOSITORY_IDENTITY_DRIFT:"+role)
        ref=read("/repos/"+repo+"/git/ref/heads/"+quote(BRANCH,safe="/"))
        require(ref.get("ref")=="refs/heads/"+BRANCH and ref.get("object",{}).get("type")=="commit","REF_IDENTITY_DRIFT:"+role)
        sha=ref.get("object",{}).get("sha","")
        require(re.fullmatch(r"[a-f0-9]{40}",sha) is not None,"INVALID_REMOTE_SHA")
        observed[role]=sha
    run=read("/repos/"+REPOS["API"][0]+"/actions/runs/"+rid+"/attempts/"+attempt)
    require(str(run.get("id"))==rid and str(run.get("run_attempt"))==attempt and
            run.get("head_sha")==checkout["API"] and
            run.get("head_branch")==BRANCH and
            run.get("event")==env.get("GITHUB_EVENT_NAME") and
            (run.get("repository") or {}).get("id")==REPOS["API"][1],"RUN_METADATA_DRIFT")
    actor=run.get("actor") or {}
    require(str(actor.get("id"))==env.get("GITHUB_ACTOR_ID") and
            actor.get("login")==env.get("GITHUB_ACTOR"),"RUN_ACTOR_DRIFT")
    tasks=[t for t in queue["tasks"] if t.get("id")=="AF-TASK-028"]
    require(len(tasks)==1,"TASK_MISSING_OR_AMBIGUOUS")
    claim=tasks[0].get("claim") or {}
    blockers=[]
    try:
        lease_of(claim)
    except ValueError:
        blockers.append("LEGACY_OR_INVALID_LEASE")
    if claim.get("status")!="ACTIVE":
        blockers.append("CLAIM_NOT_ACTIVE")
    if observed!=checkout:
        blockers.append("LIVE_HEADS_DIFFER_FROM_CHECKOUT")
    # These require independent activation, not an inference from read access.
    blockers.extend(["DEDICATED_WRITER_IDENTITY_NOT_ATTESTED",
                     "LIVE_FENCED_WRITER_NOT_ATTESTED",
                     "AUTONOMOUS_CODER_NOT_ATTESTED"])
    return {"project":UID,"mode":"REMOTE_OBSERVATION_ONLY",
            "run":{"id":int(rid),"attempt":int(attempt),"event":run["event"],
                   "trigger_actor_id":actor["id"],"trigger_actor_login":actor["login"]},
            "checkout_heads":checkout,"observed_remote_heads":observed,
            "remote_clock_samples":clocks,"queue_digest":digest(queue),
            "task_id":"AF-TASK-028","claim_owner":claim.get("owner"),
            "read_transport":"PASS","snapshot_current":observed==checkout,
            "writer_gate":"CLOSED","blockers":blockers,
            "remote_write_performed":False,"production_mutation":False}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",type=Path,required=True)
    p.add_argument("--frontend-root",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    a=p.parse_args()
    token=os.environ.get("AF_GITHUB_READ_TOKEN")
    require(bool(token),"READ_TOKEN_UNAVAILABLE")
    def get(path):
        request=Request("https://api.github.com"+path,headers={
            "Authorization":"Bearer "+token,"Accept":"application/vnd.github+json",
            "X-GitHub-Api-Version":"2022-11-28","User-Agent":"AfricaFunds-governed-preflight"})
        with urlopen(request,timeout=20) as response:
            return json.load(response),response.headers["Date"]
    heads={"API":git_head(a.api_root),"FRONTEND":git_head(a.frontend_root)}
    queue=json.loads((a.api_root/".governance/loop/task-queue.json").read_text())
    result=observe(get,os.environ,queue,heads,time.time)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print("REMOTE_EXECUTOR_READ_TRANSPORT=PASS")
    print("REMOTE_EXECUTOR_WRITER_GATE=CLOSED")
    print(json.dumps(result,sort_keys=True))


if __name__=="__main__":
    main()
