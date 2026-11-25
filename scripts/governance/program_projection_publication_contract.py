#!/usr/bin/env python3
"""Real local Git objects and compare-and-swap; no remote publication."""
import subprocess
import tempfile
from pathlib import Path
import unittest
from program_projection_publication import PATHS,BEGIN,END,prepare,publish,plan_worktrees


def git(root,*args,input=None,check=True):
    return subprocess.run(["git","-C",str(root),*args],input=input,capture_output=True,check=check)


def out(root,*args,**kwargs):
    return git(root,*args,**kwargs).stdout.decode().strip()


class LocalGit:
    def __init__(self,root):
        self.repos={}
        self.base={}
        self.candidates={}
        self.calls=[]
        self.reject=None
        self.blocks={p:BEGIN+b"\nnew\n"+END for p in set().union(*PATHS.values())}
        for role,paths in PATHS.items():
            repo=root/role; repo.mkdir()
            git(repo,"init")
            git(repo,"config","user.name","AF contract fixture")
            git(repo,"config","user.email","fixture@example.invalid")
            self.repos[role]=repo
            for path in paths:
                (repo/path).write_bytes(b"history\n"+BEGIN+b"\nold\n"+END+b"\nkeep\n")
            git(repo,"add","."); git(repo,"commit","-m","base")
            self.base[role]=out(repo,"rev-parse","HEAD")
            git(repo,"update-ref","refs/heads/contract-fixture",self.base[role])
            for path in paths:
                (repo/path).write_bytes(b"history\n"+self.blocks[path]+b"\nkeep\n")
            git(repo,"add","."); git(repo,"commit","-m","projection candidate")
            self.candidates[role]=out(repo,"rev-parse","HEAD")

    def inspect(self,role,base,candidate):
        r=self.repos[role]
        parents=out(r,"rev-list","--parents","-n","1",candidate).split()[1:]
        changes=out(r,"diff","--name-only",base,candidate).splitlines()
        files={p:(git(r,"show",base+":"+p).stdout,git(r,"show",candidate+":"+p).stdout)
               for p in PATHS[role]}
        return {"parents":parents,"changes":changes,"files":files}

    def heads(self):
        return {role:out(r,"rev-parse","refs/heads/contract-fixture") for role,r in self.repos.items()}

    def cas(self,role,old,new):
        self.calls.append(role)
        if self.reject==role: return False
        r=self.repos[role]
        if out(r,"rev-list","--parents","-n","1",new).split()[1:]!=[old]: return False
        return git(r,"update-ref","refs/heads/contract-fixture",new,old,check=False).returncode==0


class Contract(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory()
        self.addCleanup(self.t.cleanup)
        self.g=LocalGit(Path(self.t.name))
        self.plan=prepare(self.g.base,self.g.candidates,self.g.inspect,self.g.blocks)
        self.confirm="PUBLISH_"+self.plan["plan_id"]
        self.auth=lambda p,h,r:True  # isolated fixture only

    def test_two_real_git_refs(self):
        self.assertEqual(self.g.heads(),self.g.base)
        p=publish(self.plan,self.g,self.auth,self.confirm)
        self.assertEqual(p["status"],"APPLIED")
        self.assertEqual(self.g.heads(),self.g.candidates)
        self.assertEqual(self.g.calls,["API","FRONTEND"])

    def test_partial_and_recovery(self):
        self.g.reject="FRONTEND"
        p=publish(self.plan,self.g,self.auth,self.confirm)
        self.assertEqual(p["status"],"PARTIAL_REOBSERVE")
        self.assertEqual(p["heads"]["API"],self.g.candidates["API"])
        self.assertEqual(p["heads"]["FRONTEND"],self.g.base["FRONTEND"])
        self.g.reject=None
        with self.assertRaisesRegex(ValueError,"PARTIAL_RECONCILIATION_REQUIRED"):
            publish(self.plan,self.g,self.auth,self.confirm)
        p2=publish(self.plan,self.g,self.auth,self.confirm,p)
        self.assertEqual(p2["status"],"APPLIED")
        self.assertEqual(p2["effects"],["FRONTEND"])
        self.assertEqual(publish(self.plan,self.g,self.auth,self.confirm,p2)["status"],"ALREADY_APPLIED")

    def test_no_change_no_effect(self):
        for role,sha in self.g.candidates.items():
            self.g.cas(role,self.g.base[role],sha)
        self.g.calls=[]
        p=prepare(self.g.candidates,self.g.candidates,self.g.inspect,self.g.blocks)
        self.assertEqual(publish(p,self.g,self.auth,"PUBLISH_"+p["plan_id"])["status"],"NO_CHANGE")
        self.assertEqual(self.g.calls,[])

    def test_denied_and_stale(self):
        with self.assertRaisesRegex(ValueError,"EXPLICIT_CONFIRMATION"):
            publish(self.plan,self.g,self.auth,"no")
        p=publish(self.plan,self.g,lambda *a:False,self.confirm)
        self.assertEqual(p["status"],"PARTIAL_REOBSERVE")
        self.assertEqual(self.g.calls,[])
        self.g.cas("FRONTEND",self.g.base["FRONTEND"],self.g.candidates["FRONTEND"])
        with self.assertRaisesRegex(ValueError,"PARTIAL_RECONCILIATION_REQUIRED"):
            publish(self.plan,self.g,self.auth,self.confirm)

    def test_outside_and_non_exact_child(self):
        role="API"; repo=self.g.repos[role]
        p=repo/"STATUS.md"; p.write_bytes(p.read_bytes()+b"unapproved")
        git(repo,"add","."); git(repo,"commit","-m","outside")
        cand=dict(self.g.candidates); cand[role]=out(repo,"rev-parse","HEAD")
        with self.assertRaisesRegex(ValueError,"CANDIDATE_NOT_EXACT_CHILD"):
            prepare(self.g.base,cand,self.g.inspect,self.g.blocks)
        def corrupt(role,base,candidate):
            x=self.g.inspect(role,base,candidate)
            if role=="API":
                a,b=x["files"]["STATUS.md"]; x["files"]["STATUS.md"]=(a,b+b"bad")
            return x
        with self.assertRaisesRegex(ValueError,"OUTSIDE_BLOCK_CHANGED"):
            prepare(self.g.base,self.g.candidates,corrupt,self.g.blocks)


    def test_worktree_plan_and_no_change(self):
        for role,repo in self.g.repos.items():
            git(repo,"checkout","--detach",self.g.base[role])
        p=plan_worktrees(self.g.repos,self.g.base,self.g.blocks,"dry-run")
        self.assertEqual(p["status"],"CHANGES_REQUIRE_CONFIRMED_LOCAL_APPLY")
        self.assertEqual(p["candidate_objects_created"],0)
        for role,repo in self.g.repos.items():
            for path in PATHS[role]:
                (repo/path).write_bytes(b"history\n"+self.g.blocks[path]+b"\nkeep\n")
        p=plan_worktrees(self.g.repos,self.g.base,self.g.blocks,"apply-local")
        self.assertEqual(p["status"],"PREPARED_LOCAL")
        self.assertEqual(p["candidate_objects_created"],2)
        self.assertEqual(self.g.heads(),self.g.base)
        for role,repo in self.g.repos.items():
            self.assertEqual(out(repo,"rev-parse","HEAD"),self.g.base[role])
            candidate=p["plan"]["repositories"][role]["candidate"]
            self.assertEqual(out(repo,"rev-list","--parents","-n","1",candidate).split()[1:],[self.g.base[role]])
            git(repo,"checkout","--detach",candidate)
        heads={role:out(repo,"rev-parse","HEAD") for role,repo in self.g.repos.items()}
        p=plan_worktrees(self.g.repos,heads,self.g.blocks,"dry-run")
        self.assertEqual(p["status"],"NO_CHANGE")
        self.assertEqual(p["candidate_objects_created"],0)
        self.assertEqual(self.g.heads(),self.g.base)


if __name__=="__main__":
    unittest.main(verbosity=2)
