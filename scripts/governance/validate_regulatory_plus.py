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
    '.governance/loop/state.json'
]
errors=[]
for rel in required:
    p=ROOT/rel
    if not p.exists(): errors.append(f'MISSING:{rel}')
    elif p.stat().st_size == 0: errors.append(f'EMPTY:{rel}')
for rel in ['.governance/knowledge/authority-map.json','.governance/knowledge/requirements.json','.governance/knowledge/evidence.json','.governance/matrices/traceability.json','.governance/loop/state.json','.governance/loop/task-queue.json','.governance/loop/handoff.json','.governance/MANIFEST.json']:
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

print(json.dumps({'valid':not errors,'errors':errors,'requirements':len(ids),'trace_rows':len(trace)},indent=2))
sys.exit(1 if errors else 0)
