#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REG=ROOT/'.governance/incidents/registry.json'
QUEUE=ROOT/'.governance/loop/task-queue.json'
EVID=ROOT/'.governance/knowledge/evidence.json'
ALLOWED_STATUS={'DETECTED','TRIAGED','CONTAINED','MITIGATED','RCA_PENDING','CORRECTIVE_ACTION_IN_PROGRESS','VERIFYING','RESOLVED','CLOSED','BLOCKED_EXTERNAL'}
ALLOWED_ROOT={'PROVEN','PROBABLE','UNKNOWN'}

def load(p): return json.loads(p.read_text(encoding='utf-8'))

def main():
    r=load(REG); q=load(QUEUE); e=load(EVID)
    errors=[]
    tasks={x.get('id') for x in q.get('tasks',[])}
    ev={x.get('id') for x in e.get('evidence',[])}
    ids=set()
    for inc in r.get('incidents',[]):
        iid=inc.get('id')
        if iid in ids: errors.append(f'DUPLICATE_INCIDENT:{iid}')
        ids.add(iid)
        if not re.match(r'^AF-INC-\d{8}-\d{3},iid or ''): errors.append(f'BAD_ID:{iid}')
        if inc.get('status') not in ALLOWED_STATUS: errors.append(f'BAD_STATUS:{iid}')
        rc=inc.get('root_cause',{})
        mech=inc.get('mechanism',{})
        if rc.get('status') not in ALLOWED_ROOT: errors.append(f'BAD_ROOT_STATUS:{iid}')
        if mech.get('status') not in ALLOWED_ROOT: errors.append(f'BAD_MECHANISM_STATUS:{iid}')
        if rc.get('status')=='PROVEN' and not rc.get('evidence_refs'): errors.append(f'PROVEN_ROOT_WITHOUT_EVIDENCE:{iid}')
        if mech.get('status')=='PROVEN' and not mech.get('evidence_refs'): errors.append(f'PROVEN_MECHANISM_WITHOUT_EVIDENCE:{iid}')
        if inc.get('status')=='CLOSED':
            if rc.get('status')!='PROVEN': errors.append(f'CLOSED_WITHOUT_PROVEN_ROOT:{iid}')
            if not inc.get('closure',{}).get('criteria_met'): errors.append(f'CLOSED_WITHOUT_VERIFIED_CLOSURE:{iid}')
            if not inc.get('closure',{}).get('verification_refs'): errors.append(f'CLOSED_WITHOUT_VERIFICATION:{iid}')
        rec=inc.get('recurrence',{})
        if int(rec.get('occurrence_count',0))>1 and rec.get('escalation_required') is not True:
            errors.append(f'RECURRENT_WITHOUT_ESCALATION:{iid}')
        for t in inc.get('linked_tasks',[]):
            if t not in tasks: errors.append(f'UNKNOWN_TASK:{iid}:{t}')
        for ref in (inc.get('evidence_refs',[])+rc.get('evidence_refs',[])+mech.get('evidence_refs',[])):
            if isinstance(ref,str) and ref.startswith('AF-EVD-') and ref not in ev:
                errors.append(f'UNKNOWN_EVIDENCE:{iid}:{ref}')
        pm=ROOT/inc.get('postmortem_ref','')
        if not pm.exists(): errors.append(f'MISSING_POSTMORTEM:{iid}:{pm}')
        for action in inc.get('corrective_actions',[]):
            if not action.get('id') or not action.get('status') or not action.get('description'):
                errors.append(f'BAD_CORRECTIVE_ACTION:{iid}')
            for t in action.get('task_refs',[]):
                if t not in tasks: errors.append(f'UNKNOWN_ACTION_TASK:{iid}:{t}')
    out={'schema_version':'1.0.0','project_uid':'CS-AFRICAFUNDS-001','incident_count':len(ids),'status':'PASS' if not errors else 'FAIL','errors':errors}
    print(json.dumps(out,indent=2,ensure_ascii=False))
    raise SystemExit(1 if errors else 0)

if __name__=='__main__': main()
,iid or ''): errors.append(f'BAD_ID:{iid}')
        if inc.get('status') not in ALLOWED_STATUS: errors.append(f'BAD_STATUS:{iid}')
        rc=inc.get('root_cause',{})
        mech=inc.get('mechanism',{})
        if rc.get('status') not in ALLOWED_ROOT: errors.append(f'BAD_ROOT_STATUS:{iid}')
        if mech.get('status') not in ALLOWED_ROOT: errors.append(f'BAD_MECHANISM_STATUS:{iid}')
        if rc.get('status')=='PROVEN' and not rc.get('evidence_refs'): errors.append(f'PROVEN_ROOT_WITHOUT_EVIDENCE:{iid}')
        if mech.get('status')=='PROVEN' and not mech.get('evidence_refs'): errors.append(f'PROVEN_MECHANISM_WITHOUT_EVIDENCE:{iid}')
        if inc.get('status')=='CLOSED':
            if rc.get('status')!='PROVEN': errors.append(f'CLOSED_WITHOUT_PROVEN_ROOT:{iid}')
            if not inc.get('closure',{}).get('criteria_met'): errors.append(f'CLOSED_WITHOUT_VERIFIED_CLOSURE:{iid}')
            if not inc.get('closure',{}).get('verification_refs'): errors.append(f'CLOSED_WITHOUT_VERIFICATION:{iid}')
        rec=inc.get('recurrence',{})
        if int(rec.get('occurrence_count',0))>1 and rec.get('escalation_required') is not True:
            errors.append(f'RECURRENT_WITHOUT_ESCALATION:{iid}')
        for t in inc.get('linked_tasks',[]):
            if t not in tasks: errors.append(f'UNKNOWN_TASK:{iid}:{t}')
        for ref in (inc.get('evidence_refs',[])+rc.get('evidence_refs',[])+mech.get('evidence_refs',[])):
            if isinstance(ref,str) and ref.startswith('AF-EVD-') and ref not in ev:
                errors.append(f'UNKNOWN_EVIDENCE:{iid}:{ref}')
        pm=ROOT/inc.get('postmortem_ref','')
        if not pm.exists(): errors.append(f'MISSING_POSTMORTEM:{iid}:{pm}')
        for action in inc.get('corrective_actions',[]):
            if not action.get('id') or not action.get('status') or not action.get('description'):
                errors.append(f'BAD_CORRECTIVE_ACTION:{iid}')
            for t in action.get('task_refs',[]):
                if t not in tasks: errors.append(f'UNKNOWN_ACTION_TASK:{iid}:{t}')
    out={'schema_version':'1.0.0','project_uid':'CS-AFRICAFUNDS-001','incident_count':len(ids),'status':'PASS' if not errors else 'FAIL','errors':errors}
    print(json.dumps(out,indent=2,ensure_ascii=False))
    raise SystemExit(1 if errors else 0)

if __name__=='__main__': main()
