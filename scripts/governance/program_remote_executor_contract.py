#!/usr/bin/env python3
import copy
from email.utils import formatdate
import unittest
from program_remote_executor_preflight import observe, REPOS, BRANCH, OWNER_ID

HEADS={"API":"a"*40,"FRONTEND":"b"*40}
ENV={"GITHUB_REPOSITORY":REPOS["API"][0],"GITHUB_REF":"refs/heads/"+BRANCH,
     "GITHUB_SHA":HEADS["API"],"GITHUB_RUN_ID":"123","GITHUB_RUN_ATTEMPT":"1",
     "GITHUB_EVENT_NAME":"push","GITHUB_ACTOR_ID":str(OWNER_ID),"GITHUB_ACTOR":"Wealthtechinnovations"}
QUEUE={"tasks":[{"id":"AF-TASK-028","claim":{"status":"ACTIVE","owner":"legacy"}}]}


def fixtures():
    data={}
    for role,(name,ident) in REPOS.items():
        data["/repos/"+name]={"id":ident,"full_name":name,"owner":{"id":OWNER_ID},"default_branch":BRANCH}
        data["/repos/"+name+"/git/ref/heads/"+BRANCH]={"ref":"refs/heads/"+BRANCH,"object":{"type":"commit","sha":HEADS[role]}}
    data["/repos/"+REPOS["API"][0]+"/actions/runs/123/attempts/1"]={
        "id":123,"run_attempt":1,"head_sha":HEADS["API"],"head_branch":BRANCH,
        "event":"push","repository":{"id":REPOS["API"][1]},
        "actor":{"id":OWNER_ID,"login":"Wealthtechinnovations"}}
    return data


class Contract(unittest.TestCase):
    def check(self,data=None,env=None,date=1000):
        data=fixtures() if data is None else data
        return observe(lambda path:(data[path],formatdate(date,usegmt=True)),
                       ENV if env is None else env,copy.deepcopy(QUEUE),HEADS,lambda:1000)
    def test_live_read_does_not_admit_writer(self):
        r=self.check()
        self.assertEqual(r["read_transport"],"PASS")
        self.assertEqual(r["writer_gate"],"CLOSED")
        self.assertIn("LEGACY_OR_INVALID_LEASE",r["blockers"])
        self.assertFalse(r["remote_write_performed"])
    def test_stale_head(self):
        data=fixtures()
        data["/repos/"+REPOS["FRONTEND"][0]+"/git/ref/heads/"+BRANCH]["object"]["sha"]="c"*40
        r=self.check(data)
        self.assertFalse(r["snapshot_current"])
        self.assertIn("LIVE_HEADS_DIFFER_FROM_CHECKOUT",r["blockers"])
    def test_wrong_repository(self):
        data=fixtures()
        data["/repos/"+REPOS["FRONTEND"][0]]["id"]=1
        with self.assertRaisesRegex(ValueError,"REPOSITORY_IDENTITY_DRIFT"): self.check(data)
    def test_wrong_actor(self):
        with self.assertRaisesRegex(ValueError,"RUN_ACTOR_DRIFT"):
            self.check(env={**ENV,"GITHUB_ACTOR_ID":"1"})
    def test_wrong_run_attempt(self):
        data=fixtures()
        data["/repos/"+REPOS["API"][0]+"/actions/runs/123/attempts/1"]["run_attempt"]=2
        with self.assertRaisesRegex(ValueError,"RUN_METADATA_DRIFT"): self.check(data)
    def test_clock_skew(self):
        with self.assertRaisesRegex(ValueError,"REMOTE_CLOCK_SKEW"): self.check(date=2000)


if __name__=="__main__":
    unittest.main(verbosity=2)
