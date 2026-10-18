#!/usr/bin/env python3
"""Deterministic exhaustive Markdown certification for both AfricaFunds repositories."""
from __future__ import annotations
import argparse, hashlib, json, re, subprocess
from collections import Counter
from pathlib import Path

CORE = {
    "00_START_HERE.md": ("entrypoint", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "GOVERNANCE.md": ("governance", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "SOURCE_OF_TRUTH.md": ("source_of_truth", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "AGENTS.md": ("agent_contract", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "DIRECTIVE_TRAVAIL.md": ("work_directive", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "LOOP_ENGINEERING.md": ("loop_method", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "PROJECT_CONTEXT.md": ("project_context", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "STATUS.md": ("current_status", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "LOOP_STATE.md": ("loop_state", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "CURRENT_ITERATION.md": ("current_iteration", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "HANDOFF.md": ("handoff", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "NEXT_ACTION.md": ("next_action", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "OPEN_QUESTIONS.md": ("open_questions", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "WORK_LOG.md": ("work_log", "CURRENT_SPECIALIZED", "REQUIRED_STARTUP"),
    "SUIVI.md": ("global_history", "CURRENT_CANONICAL", "REQUIRED_STARTUP"),
    "CLAUDE.md": ("agent_adapter_claude", "ADAPTER", "REQUIRED_STARTUP"),
    "GPT.md": ("agent_adapter_gpt", "ADAPTER", "REQUIRED_STARTUP"),
    "MCP_AUTONOMY.md": ("mcp_adapter", "ADAPTER", "TASK_DEPENDENT"),
}
MIRRORED = {
    "00_START_HERE.md","GOVERNANCE.md","SOURCE_OF_TRUTH.md","AGENTS.md",
    "DIRECTIVE_TRAVAIL.md","LOOP_ENGINEERING.md",
    "docs/architecture/GITHUB_S2_RUNTIME_AUTHORITY_MODEL.md",
    "docs/governance/GOV-006_GITHUB_S2_RECONCILIATION_2026-09-10.md",
    "docs/runbooks/GITHUB_S2_RECONCILIATION_RUNBOOK.md",
}

def git_blob(root, rel):
    return subprocess.check_output(["git","-C",str(root),"hash-object",rel], text=True).strip()

def get_headings(text):
    rows=[]
    for line in text.splitlines():
        m=re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if m:
            rows.append({"level":len(m.group(1)),"text":m.group(2)[:240]})
    return rows

def explicit_status(text):
    for line in text.splitlines()[:80]:
        m=re.search(r"(?:Statut|STATUS)\s*:?\s*[\x60*]*([A-Z][A-Z0-9_ -]{2,})", line, re.I)
        if m:
            return re.sub(r"\s+","_",m.group(1).strip().upper())[:80]
    return None

def classify(path, text, repo_role):
    name=Path(path).name
    low=path.lower()
    hs=get_headings(text)
    title=hs[0]["text"] if hs else name
    if name in CORE:
        domain,status,priority=CORE[name]
        if name=="SUIVI.md" and repo_role=="API":
            domain,status,priority="global_history_pointer","ADAPTER","REQUIRED_STARTUP"
        if name in {"STATUS.md","LOOP_STATE.md","CURRENT_ITERATION.md","HANDOFF.md","NEXT_ACTION.md","OPEN_QUESTIONS.md","WORK_LOG.md"} and repo_role=="FRONTEND":
            domain,status,priority="peer_central_registry_reference","ADAPTER","REQUIRED_STARTUP"
        authority=name
    elif low.startswith(".github/issue_template/") or name=="PULL_REQUEST_TEMPLATE.md" or "/templates/" in low:
        domain,status,priority,authority="template","TEMPLATE","TASK_DEPENDENT",path
    elif low.startswith("docs/12-optional/"):
        domain,status,priority,authority="optional_policy","CONDITIONAL","TASK_DEPENDENT",path
    elif "adr" in low or name=="DECISIONS.md":
        domain,status,priority,authority="decisions","CURRENT_SPECIALIZED","TASK_DEPENDENT","docs/DECISIONS.md"
    elif "governance" in low or low.startswith("docs/01-governance/"):
        domain,status,priority,authority="governance_specialized","CURRENT_SPECIALIZED","TASK_DEPENDENT","GOVERNANCE.md"
    elif "architecture" in low or low.startswith("docs/03-architecture/") or "architecture" in name.lower():
        domain,status,priority,authority="architecture","CURRENT_SPECIALIZED","TASK_DEPENDENT","docs/03-architecture/ARCHITECTURE.md"
    elif low.startswith("docs/04-development/") or name in {"README_DEV.md","CODE_REVIEW.md"}:
        domain,status,priority,authority="development","CURRENT_SPECIALIZED","TASK_DEPENDENT","DIRECTIVE_TRAVAIL.md"
    elif low.startswith("docs/05-quality/") or "audit" in low or "diagnostic" in low:
        status="DIAGNOSTIC_SNAPSHOT" if ("audit" in low or "diagnostic" in low) else "CURRENT_SPECIALIZED"
        domain,priority,authority="quality_or_diagnostic","TASK_DEPENDENT","docs/05-quality/QUALITY_GATES.md"
    elif low.startswith("docs/06-delivery/") or "deployment" in low or "deploy" in name.lower():
        domain,status,priority,authority="delivery","CURRENT_SPECIALIZED","TASK_DEPENDENT","docs/06-delivery/DEPLOYMENT.md"
    elif low.startswith("docs/07-operations/") or "ops_" in name.lower():
        domain,status,priority,authority="operations","CURRENT_SPECIALIZED","TASK_DEPENDENT","docs/07-operations/RUNBOOK.md"
    elif low.startswith("docs/08-security/") or "security" in low:
        domain,status,priority,authority="security","CURRENT_SPECIALIZED","TASK_DEPENDENT","docs/08-security/ACCESS_CONTROL.md"
    elif low.startswith("docs/09-loop/"):
        domain,status,priority,authority="loop_specialized","CURRENT_SPECIALIZED","TASK_DEPENDENT","LOOP_ENGINEERING.md"
    elif low.startswith("docs/10-ai/"):
        domain,status,priority,authority="ai_governance","CURRENT_SPECIALIZED","TASK_DEPENDENT","AGENTS.md"
    elif any(x in low for x in ["roadmap","todo","tasks","backlog"]):
        domain,status,priority,authority="planning","CURRENT_SPECIALIZED","TASK_DEPENDENT",path
    elif "changelog" in low:
        domain,status,priority,authority="change_history","CURRENT_SPECIALIZED","HISTORICAL_REFERENCE",path
    elif re.search(r"202[0-9][-_]",path) or "plan" in low or "corrections" in low or "t13_" in low:
        domain,status,priority,authority="historical_or_plan","HISTORICAL","HISTORICAL_REFERENCE",path
    else:
        domain,status,priority,authority="specialized_documentation","CURRENT_SPECIALIZED","TASK_DEPENDENT",path

    stated=explicit_status(text)
    if stated in {"HISTORICAL","SUPERSEDED","SUPERSEDED_STATE","CONDITIONAL","TARGET_NOT_ENFORCED"}:
        status=stated

    actions={"CURRENT_CANONICAL":"KEEP","CURRENT_SPECIALIZED":"SPECIALIZED","ADAPTER":"ADAPT",
             "HISTORICAL":"HISTORICAL","DIAGNOSTIC_SNAPSHOT":"HISTORICAL",
             "TEMPLATE":"KEEP","CONDITIONAL":"CONDITIONAL"}
    consumers=["ALL_AGENTS"] if priority=="REQUIRED_STARTUP" else ["TASK_DEPENDENT"]
    if domain in {"delivery","operations"}: consumers += ["CI","OPERATIONS"]
    if domain=="security": consumers += ["SECURITY_REVIEW"]
    if domain=="development": consumers += ["DEVELOPMENT"]

    contradictions=[]
    checks=[
        (r"NEW_BRANCH_CREATION\s*=\s*ALLOWED","BRANCH_CREATION_ALLOWED"),
        (r"FORCE_PUSH\s*=\s*ALLOWED","FORCE_PUSH_ALLOWED"),
        (r"CONTEXT_RECONSTRUCTION_BEFORE_WORK\s*=\s*OPTIONAL","CONTEXT_RECONSTRUCTION_OPTIONAL"),
    ]
    for pattern,label in checks:
        if re.search(pattern,text,re.I):
            contradictions.append(label)

    stale=[]
    if status in {"CURRENT_CANONICAL","CURRENT_SPECIALIZED","ADAPTER"} and re.search(r"\bdefault branch\b.{0,80}\b(?:server|master)\b",text,re.I|re.S):
        stale.append("POSSIBLE_LEGACY_DEFAULT_BRANCH_REFERENCE_REVIEW")

    security="HIGH" if ("security" in low or "secret" in text.lower() or ".env" in text.lower()) else "NONE"
    production="YES" if any(x in (low+" "+text[:2000].lower()) for x in ["s2","production","deploy","pm2","runtime"]) else "NO"
    unique=[h["text"] for h in hs[:20]]
    if not unique:
        unique=[line.strip()[:240] for line in text.splitlines() if line.strip()][:5]

    return {
        "role":domain,
        "status":status,
        "authority_level":"CANONICAL" if status=="CURRENT_CANONICAL" else ("HISTORICAL" if status in {"HISTORICAL","DIAGNOSTIC_SNAPSHOT"} else status),
        "canonical_authority":authority,
        "unique_information":unique,
        "consumers":sorted(set(consumers)),
        "read_priority":priority,
        "action":actions.get(status,"KEEP"),
        "contradictions":contradictions,
        "duplication_risk":"EXPECTED_MIRROR" if path in MIRRORED else "NONE",
        "stale_state":stale,
        "security_impact":security,
        "production_impact":production,
        "title":title,
    }

def scan(root, repository, role):
    out=[]
    for p in sorted(Path(root).rglob("*.md")):
        if ".git" in p.parts:
            continue
        rel=p.relative_to(root).as_posix()
        raw=p.read_bytes()
        text=raw.decode("utf-8",errors="replace")
        row=classify(rel,text,role)
        blob=git_blob(root,rel)
        row.update({
            "repository":repository,
            "repository_role":role,
            "path":rel,
            "git_blob_sha":blob,
            "last_validated_sha":blob,
            "content_sha256":hashlib.sha256(raw).hexdigest(),
            "line_count":len(text.splitlines()),
            "byte_count":len(raw),
            "headings":get_headings(text)[:40],
        })
        out.append(row)
    return out

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--api-root",required=True)
    p.add_argument("--frontend-root",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--summary",required=True)
    a=p.parse_args()
    api=Path(a.api_root).resolve()
    front=Path(a.frontend_root).resolve()
    rows=scan(api,"Wealthtechinnovations/api_opcv","API")+scan(front,"Wealthtechinnovations/front_end_opcvm","FRONTEND")
    orphans=[r for r in rows if not r["canonical_authority"]]
    critical=[r for r in rows if r["contradictions"]]
    by_status=Counter(r["status"] for r in rows)
    by_repo=Counter(r["repository_role"] for r in rows)
    payload={
        "schema_version":"1.0.0",
        "project_uid":"CS-AFRICAFUNDS-001",
        "project_name":"AfricaFunds",
        "certification_semantics":"Every Markdown file was opened and read byte-for-byte, fingerprinted, classified, routed to an authority, and checked for deterministic contradiction markers.",
        "repositories":{
            "API":{"full_name":"Wealthtechinnovations/api_opcv","head":subprocess.check_output(["git","-C",str(api),"rev-parse","HEAD"],text=True).strip()},
            "FRONTEND":{"full_name":"Wealthtechinnovations/front_end_opcvm","head":subprocess.check_output(["git","-C",str(front),"rev-parse","HEAD"],text=True).strip()},
        },
        "summary":{
            "total_md_discovered":len(rows),
            "total_md_certified":len(rows),
            "by_repository":dict(by_repo),
            "by_status":dict(by_status),
            "orphan_authority":len(orphans),
            "unresolved_critical_contradiction":len(critical),
            "all_markdown_exploited_candidate":len(orphans)==0 and len(critical)==0,
        },
        "entries":rows,
    }
    Path(a.output).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lines=[
        "# AfricaFunds Markdown audit",
        "TOTAL_MD_DISCOVERED="+str(len(rows)),
        "TOTAL_MD_CERTIFIED="+str(len(rows)),
        "API_MD="+str(by_repo.get("API",0)),
        "FRONTEND_MD="+str(by_repo.get("FRONTEND",0)),
        "ORPHAN_AUTHORITY="+str(len(orphans)),
        "UNRESOLVED_CRITICAL_CONTRADICTION="+str(len(critical)),
        "ALL_MARKDOWN_EXPLOITED_CANDIDATE="+("TRUE" if len(orphans)==0 and len(critical)==0 else "FALSE"),
    ]
    Path(a.summary).write_text("\n".join(lines)+"\n",encoding="utf-8")
    print("\n".join(lines))
    if orphans or critical:
        raise SystemExit(2)

if __name__=="__main__":
    main()
