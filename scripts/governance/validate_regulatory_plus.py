#!/usr/bin/env python3
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
required = [
    'GOVERNANCE.md','SOURCE_OF_TRUTH.md','AGENTS.md','LOOP_ENGINEERING.md',
    'PROJECT_CONTEXT.md','STATUS.md','NEXT_ACTION.md','LOOP_STATE.md',
    'CURRENT_ITERATION.md','WORK_LOG.md','HANDOFF.md','OPEN_QUESTIONS.md',
    'DOCUMENT_INDEX.md','FILES_CATALOG.md','MANIFEST.md','DOCUMENT_INTEGRATION_MATRIX.md',
    'docs/01-governance/PROJECT_RULES.md','docs/01-governance/DEFINITION_OF_READY.md',
    'docs/01-governance/DEFINITION_OF_DONE.md','docs/09-loop/DRIFT_DETECTION.md',
    'docs/10-ai/AI_GOVERNANCE.md','.governance/knowledge/authority-map.json',
    '.governance/knowledge/requirements.json','.governance/matrices/traceability.json',
    '.governance/loop/state.json',
    '.governance/project.json','.governance/repository.json',
    '.governance/branch-baseline.json',
    '.governance/knowledge/markdown-registry.json',
    '.governance/schemas/markdown-registry.schema.json',
    'scripts/governance/audit_markdown.py',
    'scripts/governance/reconstruct_context.py',
    'scripts/governance/s2_observe.py',
    'scripts/governance/s2_git_guard.sh',
    '.github/workflows/governance-markdown-audit.yml',
    '.github/workflows/governance-multi-agent-resume.yml',
    '.github/workflows/governance-branch-policy.yml',
    '.github/workflows/ops-s2-observe.yml',
    '.github/workflows/ops-deploy-api.yml',
    '.github/workflows/ops-deploy-frontend.yml'
]
errors=[]
for rel in required:
    p=ROOT/rel
    if not p.exists(): errors.append(f'MISSING:{rel}')
    elif p.stat().st_size == 0: errors.append(f'EMPTY:{rel}')
for rel in ['.governance/project.json','.governance/repository.json','.governance/branch-baseline.json','.governance/knowledge/markdown-registry.json','.governance/schemas/markdown-registry.schema.json','.governance/knowledge/authority-map.json','.governance/knowledge/requirements.json','.governance/knowledge/evidence.json','.governance/matrices/traceability.json','.governance/loop/state.json','.governance/loop/task-queue.json','.governance/loop/handoff.json','.governance/MANIFEST.json']:
    try: json.loads((ROOT/rel).read_text(encoding='utf-8'))
    except Exception as exc: errors.append(f'JSON:{rel}:{exc}')
req=json.loads((ROOT/'.governance/knowledge/requirements.json').read_text())['requirements']
ids=[x['id'] for x in req]
if len(ids) != len(set(ids)): errors.append('DUPLICATE_REQUIREMENT_ID')
trace=json.loads((ROOT/'.governance/matrices/traceability.json').read_text())['rows']
for row in trace:
    if row['requirement_id'] not in ids: errors.append(f"ORPHAN_TRACE:{row['requirement_id']}")

# Product naming policy: new canonical identity must be AfricaFunds, while explicit
# historical references to FundAfrica remain allowed for traceability and for real
# technical paths that have not been migrated.
canonical_markers = {
    'PROJECT_CONTEXT.md': ['# PROJECT_CONTEXT — AfricaFunds API', 'Produit canonique : **AfricaFunds**.'],
    'STATUS.md': ['# STATUS — AfricaFunds API'],
    'docs/01-governance/PROJECT_RULES.md': ['# PROJECT_RULES — AfricaFunds API'],
}
for rel, markers in canonical_markers.items():
    text=(ROOT/rel).read_text(encoding='utf-8')
    for marker in markers:
        if marker not in text:
            errors.append(f'NONCANONICAL_PRODUCT_IDENTITY:{rel}:{marker}')



# Final-certification invariants: these are executable gates, not prose-only goals.
project=json.loads((ROOT/'.governance/project.json').read_text(encoding='utf-8'))
repo_meta=json.loads((ROOT/'.governance/repository.json').read_text(encoding='utf-8'))
expected_branch='claude/code-review-improvements-ikvuj'
if project.get('project_uid') != 'CS-AFRICAFUNDS-001':
    errors.append('PROJECT_UID_MISMATCH')
if project.get('context_reconstruction_before_work') != 'REQUIRED':
    errors.append('CONTEXT_RECONSTRUCTION_NOT_REQUIRED')
if project.get('cross_repo_discovery') != 'REQUIRED':
    errors.append('CROSS_REPO_DISCOVERY_NOT_REQUIRED')
if project.get('no_blind_work') != 'REQUIRED':
    errors.append('NO_BLIND_WORK_NOT_REQUIRED')
if project.get('canonical_branch') != expected_branch:
    errors.append('PROJECT_CANONICAL_BRANCH_MISMATCH')
if repo_meta.get('canonical_branch') != expected_branch:
    errors.append('REPOSITORY_CANONICAL_BRANCH_MISMATCH')
if repo_meta.get('peer_repository') != 'Wealthtechinnovations/front_end_opcvm':
    errors.append('PEER_REPOSITORY_MISMATCH')

for rel in ['00_START_HERE.md','GOVERNANCE.md','AGENTS.md','LOOP_ENGINEERING.md']:
    text=(ROOT/rel).read_text(encoding='utf-8')
    for marker in [
        'CONTEXT_RECONSTRUCTION_BEFORE_WORK = REQUIRED',
        'CROSS_REPO_DISCOVERY = REQUIRED',
        'NO_BLIND_WORK = REQUIRED',
    ]:
        if marker not in text:
            errors.append(f'MISSING_CONTEXT_GATE:{rel}:{marker}')

registry=json.loads((ROOT/'.governance/knowledge/markdown-registry.json').read_text(encoding='utf-8'))
summary=registry.get('summary',{})
entries=registry.get('entries',[])
if summary.get('total_md_discovered') != summary.get('total_md_certified'):
    errors.append('MARKDOWN_DISCOVERED_CERTIFIED_MISMATCH')
if summary.get('orphan_authority') != 0:
    errors.append('MARKDOWN_ORPHAN_AUTHORITY')
if summary.get('unresolved_critical_contradiction') != 0:
    errors.append('MARKDOWN_CRITICAL_CONTRADICTION')
if len(entries) != summary.get('total_md_certified'):
    errors.append('MARKDOWN_ENTRY_COUNT_MISMATCH')
entry_keys=[(x.get('repository'),x.get('path')) for x in entries]
if len(entry_keys) != len(set(entry_keys)):
    errors.append('MARKDOWN_DUPLICATE_ENTRY')
for row in entries:
    for key in ['repository','path','git_blob_sha','content_sha256','role','status','canonical_authority','action']:
        if not row.get(key):
            errors.append(f'MARKDOWN_ENTRY_MISSING:{row.get("repository")}:{row.get("path")}:{key}')

branch_baseline=json.loads((ROOT/'.governance/branch-baseline.json').read_text(encoding='utf-8'))
if branch_baseline.get('canonical_branch') != expected_branch:
    errors.append('BRANCH_BASELINE_CANONICAL_MISMATCH')
if branch_baseline.get('policy') != 'NEW_BRANCH_CREATION_FORBIDDEN':
    errors.append('BRANCH_BASELINE_POLICY_MISMATCH')

print(json.dumps({'valid':not errors,'errors':errors,'requirements':len(ids),'trace_rows':len(trace),'markdown_entries':len(entries)},indent=2))
sys.exit(1 if errors else 0)
