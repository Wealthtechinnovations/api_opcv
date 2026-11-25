#!/usr/bin/env python3
"""Contract tests: queue-only lease state, exact scope and actual local Git CAS."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from program_claim_lease import digest, fence, overlap, propose

HEADS={"API":"a"*40,"FRONTEND":"b"*40}
OWNER="worker-a"
SESSION="session-a"
TASK="AF-TASK-X"


def fixture():
    return {"surface_claims_contract":{"storage":"TASK_LOCAL_IN_SINGLE_QUEUE"},
            "tasks":[{"id":TASK,"status":"READY","execution_mode":"GOVERNED_CODE_CHANGE",
                      "repository_roles":["API"],"touched_surfaces":["scripts/program_*.py"],
                      "depends_on":["AF-DONE"]},
                     {"id":"AF-DONE","status":"DONE"},
                     {"id":"AF-OTHER","status":"READY","execution_mode":"GOVERNED_CODE_CHANGE",
                      "repository_roles":["API"],"touched_surfaces":["scripts/program_other.py"]}]}


def change(q,action="acquire",task=TASK,owner=OWNER,session=SESSION,now=100,**kw):
    return propose(q,digest(q),task,action,owner,session,now,HEADS,ttl=10,**kw)


class Contract(unittest.TestCase):
    def guard(self,q,generation=1,now=105,owner=OWNER,session=SESSION,heads=HEADS,effects=None):
        return fence(q,digest(q),TASK,owner,session,generation,now,HEADS,heads,
                     effects if effects is not None else [("API","scripts/program_x.py")])

    def test_no_mutation_and_scope(self):
        q=fixture(); original=deepcopy(q); a=change(q)
        self.assertEqual(q,original); self.assertTrue(self.guard(a))
        self.assertEqual(a["surface_claims_contract"]["active_claim_task_ids"],[TASK])
        with self.assertRaisesRegex(ValueError,"EFFECT_OUTSIDE_SCOPE"):
            self.guard(a,effects=[("FRONTEND","scripts/program_x.py")])
        with self.assertRaisesRegex(ValueError,"EFFECT_OUTSIDE_SCOPE"):
            self.guard(a,effects=[("API","scripts/unrelated.py")])
        with self.assertRaisesRegex(ValueError,"INVALID_SURFACE"):
            self.guard(a,effects=[("API","scripts/../x")])

    def test_conflicts_and_legacy(self):
        self.assertTrue(overlap("scripts/program_*.py","scripts/program_other.py"))
        a=change(fixture())
        with self.assertRaisesRegex(ValueError,"ACTIVE_SCOPE_CONFLICT"):
            change(a,task="AF-OTHER",owner="worker-b",session="session-b")
        old=fixture()
        old["tasks"][0]["claim"]={"status":"ACTIVE","owner":"legacy"}
        with self.assertRaisesRegex(ValueError,"TASK_ALREADY_CLAIMED"):
            change(old)
        with self.assertRaisesRegex(ValueError,"LEGACY_OR_INVALID_LEASE"):
            change(old,action="recover",now=10000,reconciled=True)

    def test_dependency_and_mode(self):
        q=fixture(); q["tasks"][1]["status"]="OPEN"
        with self.assertRaisesRegex(ValueError,"DEPENDENCY_NOT_DONE"): change(q)
        q=fixture(); q["tasks"][0]["execution_mode"]="GOV006_DEPLOY"
        with self.assertRaisesRegex(ValueError,"TASK_MODE_NOT_ADMITTED"): change(q)

    def test_expiry_recovery_and_fence(self):
        a=change(fixture())
        with self.assertRaisesRegex(ValueError,"LEASE_EXPIRED"): self.guard(a,now=110)
        with self.assertRaisesRegex(ValueError,"LEASE_NOT_EXPIRED"):
            change(a,action="recover",now=109,reconciled=True)
        with self.assertRaisesRegex(ValueError,"PRIOR_EFFECTS_NOT_RECONCILED"):
            change(a,action="recover",now=110)
        b=change(a,action="recover",now=110,owner="worker-b",session="session-b",reconciled=True)
        with self.assertRaisesRegex(ValueError,"STALE_FENCE"): self.guard(b,now=111)
        self.assertTrue(self.guard(b,now=111,generation=2,owner="worker-b",session="session-b"))

    def test_renew_release(self):
        a=change(fixture())
        with self.assertRaisesRegex(ValueError,"CLOCK_REGRESSION"):
            change(a,action="renew",now=99,generation=1)
        b=change(a,action="renew",now=108,generation=1)
        self.assertTrue(self.guard(b,now=117))
        c=change(b,action="release",now=117,generation=1)
        with self.assertRaisesRegex(ValueError,"CLAIM_NOT_ACTIVE"): self.guard(c,now=117)
        d=change(c,now=118)
        self.assertTrue(self.guard(d,now=119,generation=2))

    def test_revision_and_head_mismatch(self):
        q=fixture()
        with self.assertRaisesRegex(ValueError,"QUEUE_REVISION_MISMATCH"):
            propose(q,"0"*64,TASK,"acquire",OWNER,SESSION,100,HEADS)
        a=change(q)
        with self.assertRaisesRegex(ValueError,"HEAD_TUPLE_MISMATCH"):
            self.guard(a,heads={**HEADS,"API":"c"*40})

    def test_actual_git_compare_and_swap(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            def git(*args,input=None,check=True):
                return subprocess.run(["git","-C",str(root),*args],input=input,text=True,
                                      capture_output=True,check=check)
            git("init","--bare")
            git("config","user.name","AF contract fixture")
            git("config","user.email","fixture@example.invalid")
            def commit(q,parent=None):
                blob=git("hash-object","-w","--stdin",input=json.dumps(q)).stdout.strip()
                tree=git("mktree",input="100644 blob "+blob+"\tqueue.json\n").stdout.strip()
                return git("commit-tree",tree,*(["-p",parent] if parent else []),
                           input="contract fixture\n").stdout.strip()
            q=fixture(); base=commit(q); ref="refs/heads/contract-fixture"
            git("update-ref",ref,base)
            a=change(q); b=change(q,owner="worker-b",session="session-b")
            candidates=[commit(a,base),commit(b,base)]
            with ThreadPoolExecutor(max_workers=2) as pool:
                outcomes=list(pool.map(lambda sha:git("update-ref",ref,sha,base,check=False).returncode,candidates))
            self.assertEqual(outcomes.count(0),1)
            winner=git("rev-parse",ref).stdout.strip()
            self.assertIn(winner,candidates)
            loser=next(c for c in candidates if c!=winner)
            self.assertNotEqual(git("update-ref",ref,loser,base,check=False).returncode,0)
            self.assertEqual(git("rev-parse",ref).stdout.strip(),winner)


if __name__=="__main__":
    unittest.main(verbosity=2)
