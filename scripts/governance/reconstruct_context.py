#!/usr/bin/env python3
"""Reconstruct AfricaFunds context from Git only; no conversation state is accepted."""
from __future__ import annotations
import argparse, hashlib, json, subprocess
from pathlib import Path

BRANCH="claude/code-review-improvements-ikvuj"
API_REPO="Wealthtechinnovations/api_opcv"
FRONT_REPO="Wealthtechinnovations/front_end_opcvm"
HISTORY_MD_REL=".governance/history/CS-AFRICAFUNDS-001-consolidated-conversation-history.md"
HISTORY_JSON_REL=".governance/history/CS-AFRICAFUNDS-001-consolidated-conversation-history.json"

def git(root,*args):
    return subprocess.check_output(["git","-C",str(root),*args],text=True).strip()

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def first_nonempty(lines):
    for line in lines:
        if line.strip(): return line.strip()
    return ""

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--agent-profile",choices=["CLAUDE","CHATGPT"],required=True)
    p.add_argument("--start-repo",choices=["API","FRONTEND"],required=True)
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()

    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()
    start=api if a.start_repo=="API" else front

    start_project=load_json(start/".governance/project.json")
    start_repo=load_json(start/".governance/repository.json")
    api_project=load_json(api/".governance/project.json")
    front_project=load_json(front/".governance/project.json")
    api_repo=load_json(api/".governance/repository.json")
    front_repo=load_json(front/".governance/repository.json")

    assert start_project["project_uid"]=="CS-AFRICAFUNDS-001"
    assert api_project==front_project, "project identity mirror drift"
    assert api_repo["peer_repository"]==FRONT_REPO
    assert front_repo["peer_repository"]==API_REPO
    assert api_repo["canonical_branch"]==BRANCH
    assert front_repo["canonical_branch"]==BRANCH
    assert start_repo["context_reconstruction_before_work"]=="REQUIRED"
    assert start_repo["cross_repo_discovery"]=="REQUIRED"

    api_branch=git(api,"branch","--show-current")
    front_branch=git(front,"branch","--show-current")
    assert api_branch==BRANCH
    assert front_branch==BRANCH
    api_sha=git(api,"rev-parse","HEAD")
    front_sha=git(front,"rev-parse","HEAD")

    history_md=(api/HISTORY_MD_REL).read_text(encoding="utf-8")
    history_meta=load_json(api/HISTORY_JSON_REL)
    assert history_meta["project_uid"]=="CS-AFRICAFUNDS-001"
    assert history_meta["continuity_key"]=="CS-AFRICAFUNDS-001"
    assert "CS-AFRICAFUNDS-001" in history_md
    history_md_sha=hashlib.sha256(history_md.encode()).hexdigest()
    history_json_bytes=(api/HISTORY_JSON_REL).read_bytes()
    history_json_sha=hashlib.sha256(history_json_bytes).hexdigest()

    queue=load_json(api/".governance/loop/task-queue.json")
    active=[x for x in queue["tasks"] if x["status"] in {"IN_PROGRESS","PENDING","BLOCKED_EXTERNAL_PROVIDER_ROTATION"}]
    current=[x for x in queue["tasks"] if x["status"]=="IN_PROGRESS"]
    blocked_external=[x for x in active if x["status"]=="BLOCKED_EXTERNAL_PROVIDER_ROTATION"]
    current_task=current[-1] if current else (blocked_external[0] if blocked_external else (active[0] if active else None))

    next_action=(api/"NEXT_ACTION.md").read_text(encoding="utf-8")
    next_hash=hashlib.sha256(next_action.encode()).hexdigest()

    suivi=(front/"SUIVI.md").read_text(encoding="utf-8")
    suivi_checkpoint=None
    for line in suivi.splitlines():
        if line.startswith("## POINT DE REPRISE COURANT"):
            suivi_checkpoint=line.lstrip("# ").strip()
            break
    if not suivi_checkpoint:
        suivi_checkpoint="SUIVI_PRESENT_NO_EXPLICIT_CHECKPOINT"

    # Live production state is deliberately not inferred from prose. A fresh session
    # must observe S2 through MCP or GitHub Actions/SSH before upgrading this field.
    production_attestation="REQUIRES_LIVE_OBSERVATION"

    logical={
        "project_uid":start_project["project_uid"],
        "project_name":start_project["project_name"],
        "one_product_two_repositories":True,
        "api_repository":API_REPO,
        "frontend_repository":FRONT_REPO,
        "api_branch":BRANCH,
        "frontend_branch":BRANCH,
        "api_sha":api_sha,
        "frontend_sha":front_sha,
        "suivi_checkpoint":suivi_checkpoint,
        "production_attestation":production_attestation,
        "current_task_id":current_task["id"] if current_task else None,
        "current_task_title":current_task["title"] if current_task else None,
        "next_action_sha256":next_hash,
        "work_gate":"OPEN_FOR_GIT_ONLY_AFTER_CONTEXT_PASS",
        "server_observation_required_for_production_work":True,
        "server_observation_nominal":"wealthtech_ssh_bridge",
        "server_observation_fallback":"github_actions_ssh",
        "new_branch_creation":"FORBIDDEN",
        "historical_memory":{
            "continuity_key":history_meta["continuity_key"],
            "status":history_meta["status"],
            "human_history_path":HISTORY_MD_REL,
            "machine_manifest_path":HISTORY_JSON_REL,
            "human_history_sha256":history_md_sha,
            "machine_manifest_sha256":history_json_sha,
            "authority":"HISTORICAL_ONLY_LIVE_AUTHORITIES_PREVAIL",
        },
    }
    payload={
        "schema_version":"1.0.0",
        "agent_profile":a.agent_profile,
        "start_repository_role":a.start_repo,
        "conversation_memory_used":False,
        "git_historical_memory_loaded":True,
        "peer_repository_discovered":start_repo["peer_repository"],
        "context_reconstruction":"PASS",
        "logical_context":logical,
        "fund_state":{
            "API_SHA":api_sha,
            "FRONTEND_SHA":front_sha,
            "SUIVI_CHECKPOINT":suivi_checkpoint,
            "PRODUCTION_ATTESTATION":production_attestation,
        },
    }
    Path(a.output).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(payload,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
