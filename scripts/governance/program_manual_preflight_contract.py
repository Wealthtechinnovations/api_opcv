#!/usr/bin/env python3
"""Exercise AF-TASK-028 dispatch guards without network, tokens or repository writes."""
import argparse
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path


def require(condition, label):
    if not condition:
        raise AssertionError(label)



def git(root, *args):
    return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()


def full_recipe(scripts, api, frontend):
    """CI equivalent: real workflow shell, real repository objects, isolated local refs.
    No network, credential, production, or remote GitHub mutation.
    """
    ref='refs/heads/claude/code-review-improvements-ikvuj'
    original=[git(api,'rev-parse','HEAD'),git(frontend,'rev-parse','HEAD')]
    originals=[git(api,'status','--porcelain'),git(frontend,'status','--porcelain')]
    with tempfile.TemporaryDirectory(prefix='af-manual-recipe-') as td:
        root=Path(td)
        mirrors=[]
        copies=[]
        for name,source,sha in zip(('api','frontend'),(api,frontend),original):
            mirror=root/(name+'.git')
            subprocess.run(['git','clone','--bare','--shared',str(source),str(mirror)],check=True,stdout=subprocess.DEVNULL)
            git(mirror,'update-ref',ref,sha)
            copy=root/name
            subprocess.run(['git','clone','--shared','--no-checkout',str(mirror),str(copy)],check=True,stdout=subprocess.DEVNULL)
            git(copy,'checkout','--detach',sha)
            copies.append(copy); mirrors.append(mirror)
        env={**os.environ,'GITHUB_REPOSITORY':'Wealthtechinnovations/api_opcv','GITHUB_REF':ref,'CANONICAL_REF':ref,'API_URL':str(mirrors[0]),'FRONT_URL':str(mirrors[1]),'GITHUB_STEP_SUMMARY':str(root/'summary.md')}
        def set_heads():
            a,b=[git(p,'rev-parse','HEAD') for p in copies]
            env.update(GITHUB_SHA=a,API_SHA=a,FRONT_SHA=b)
        def step(i, ok=True):
            result=subprocess.run(['bash','-c',scripts[i]],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
            if (result.returncode==0)!=ok:
                print(result.stdout[-16000:])
                raise AssertionError(f'workflow step {i+1}: expected success={ok}, got {result.returncode}')
        def clean():
            return all(not git(p,'status','--porcelain') for p in copies)
        def receipt(name):
            return json.loads((root/'out'/name).read_text())
        set_heads()
        env.update(MODE='dry-run',CONFIRMATION='')
        for i in range(3): step(i)
        require(clean(),'FULL_DRY_RUN_CLEAN')
        require(receipt('dry-run.json')['files_written_count']==0,'FULL_DRY_RUN_ZERO_WRITE')
        require([git(p,'rev-parse','HEAD') for p in copies]==original,'FULL_DRY_RUN_NO_COMMIT')
        require(receipt('publication-plan.json')['candidate_objects_created']==0,'DRY_RUN_ZERO_CANDIDATE_OBJECTS')
        print('MANUAL_WORKFLOW_DRY_RUN=PASS')
        # Move only the test mirror's ref, not a real remote. The last step must fail.
        git(mirrors[1],'update-ref','-d',ref)
        step(2,False)
        require(clean(),'HEAD_RECHECK_ZERO_WRITE')
        git(mirrors[1],'update-ref',ref,original[1])
        print('MANUAL_WORKFLOW_HEAD_RECHECK=PASS')
        # Exercise the confirmed local apply path against the actual generator.
        env.update(MODE='apply-local',CONFIRMATION='APPLY_LOCAL_CS-AFRICAFUNDS-001')
        for i in range(3): step(i)
        require(receipt('apply-b.json')['files_written_count']==0,'FULL_SECOND_APPLY_ZERO_WRITE')
        require([git(p,'rev-parse','HEAD') for p in copies]==original,'FULL_LOCAL_APPLY_NO_COMMIT')
        print('MANUAL_WORKFLOW_LOCAL_APPLY=PASS')
        # If initial projections were stale, commit only inside disposable fixtures
        # and seed a canonical no-change baseline for the final full workflow run.
        for copy,mirror in zip(copies,mirrors):
            if git(copy,'status','--porcelain'):
                git(copy,'add','-u')
                git(copy,'-c','user.name=AF test fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture: align projections')
                git(copy,'push',str(mirror),'HEAD:'+ref)
        set_heads()
        no_change_heads=[git(p,'rev-parse','HEAD') for p in copies]
        for i in range(3): step(i)
        require(receipt('dry-run.json')['changed_count']==0,'NO_CHANGE_DRY_RUN')
        require(receipt('apply-a.json')['files_written_count']==0,'NO_CHANGE_APPLY')
        require(clean(),'NO_CHANGE_CLEAN')
        require([git(p,'rev-parse','HEAD') for p in copies]==no_change_heads,'NO_CHANGE_NO_COMMIT')
        require(all(git(m,'rev-parse',ref)==h for m,h in zip(mirrors,no_change_heads)),'NO_CHANGE_NO_REF_UPDATE')
        plan=receipt('publication-plan.json')
        require(plan['status']=='NO_CHANGE' and plan['candidate_objects_created']==0 and plan['remote_publication'] is False,'PUBLICATION_NO_CHANGE_PLAN')
        print('PUBLICATION_WORKFLOW_WIRING=PASS')
        print('MANUAL_WORKFLOW_NO_CHANGE_NO_COMMIT=PASS')
    require([git(api,'rev-parse','HEAD'),git(frontend,'rev-parse','HEAD')]==original,'SOURCE_HEADS_UNCHANGED')
    require([git(api,'status','--porcelain'),git(frontend,'status','--porcelain')]==originals,'SOURCE_WORKTREES_UNCHANGED')
    print('MANUAL_WORKFLOW_CI_EQUIVALENT=PASS (local Git mirrors; no live dispatch or publication)')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--api-root',type=Path)
    parser.add_argument('--frontend-root',type=Path)
    args=parser.parse_args()
    require(bool(args.api_root)==bool(args.frontend_root),'BOTH_ROOTS_REQUIRED')
    root = Path(__file__).resolve().parents[2]
    workflow = root / '.github/workflows/governance-programme-projection-writeback.yml'
    if not workflow.exists():  # explicit local standalone fixture for development
        workflow = Path(__file__).with_name('governance-programme-projection-writeback.yml')
    source = workflow.read_text(encoding='utf-8')
    event = source.split('\non:\n', 1)[1].split('\npermissions:', 1)[0]
    require(re.findall(r'^  ([\w-]+):', event, re.M) == ['workflow_dispatch'], 'MANUAL_ONLY')
    require(re.search(r'^permissions:\n  contents: read\n\n', source, re.M), 'READ_ONLY')
    require('default: dry-run' in event, 'DRY_RUN_DEFAULT')
    require(source.count('persist-credentials: false') == 2, 'NO_PERSISTED_TOKEN')
    require('REMOTE_PUBLICATION=DISABLED' in source and 'S2_DEPLOYMENT=DISABLED' in source, 'NO_REMOTE_EFFECTS')
    require(not re.search(r'\bgit\s+(?:push|commit|update-ref)\b', source), 'NO_GIT_MUTATION')
    require(not re.search(r'\b(?:ssh|scp)\s', source), 'NO_S2')
    blocks = re.findall(r'^        run: \|\n((?:^          .*\n|^\n)+)', source, re.M)
    require(len(blocks) == 3, 'THREE_SHELL_STEPS')
    scripts = ['\n'.join(line[10:] if line.startswith(' '*10) else line for line in block.splitlines())+'\n' for block in blocks]
    for script in scripts:
        subprocess.run(['bash','-n'], input=script, text=True, check=True)
    a, b, other = 'a'*40, 'b'*40, 'c'*40
    ref = 'refs/heads/claude/code-review-improvements-ikvuj'
    with tempfile.TemporaryDirectory() as td:
        git = Path(td)/'git'
        git.write_text('#!/bin/bash\nif [[ "$3" == *api_opcv* ]]; then printf "%s\\t%s\\n" "$MOCK_API" "$4"; else printf "%s\\t%s\\n" "$MOCK_FRONT" "$4"; fi\n')
        git.chmod(0o755)
        env = {**os.environ, 'PATH':td+':'+os.environ['PATH'], 'GITHUB_REPOSITORY':'Wealthtechinnovations/api_opcv', 'GITHUB_REF':ref, 'CANONICAL_REF':ref, 'GITHUB_SHA':a, 'API_SHA':a, 'FRONT_SHA':b, 'MOCK_API':a, 'MOCK_FRONT':b, 'API_URL':'https://github.com/Wealthtechinnovations/api_opcv.git','FRONT_URL':'https://github.com/Wealthtechinnovations/front_end_opcvm.git','MODE':'dry-run','CONFIRMATION':''}
        cases = [
            ('dry-run valid',{},True),
            ('apply local valid',{'MODE':'apply-local','CONFIRMATION':'APPLY_LOCAL_CS-AFRICAFUNDS-001'},True),
            ('apply missing confirmation',{'MODE':'apply-local'},False),
            ('wrong branch',{'GITHUB_REF':'refs/heads/master'},False),
            ('wrong repo',{'GITHUB_REPOSITORY':'other/repo'},False),
            ('API dispatch mismatch',{'GITHUB_SHA':other},False),
            ('remote API drift',{'MOCK_API':other},False),
            ('remote frontend drift',{'MOCK_FRONT':other},False),
            ('invalid sha',{'FRONT_SHA':'not-sha'},False),
            ('unknown mode',{'MODE':'publish'},False),
            ('unexpected dry-run confirmation',{'CONFIRMATION':'yes'},False),
        ]
        for name, overrides, expected in cases:
            result = subprocess.run(['bash','-c',scripts[0]], env={**env,**overrides},capture_output=True)
            require((result.returncode==0)==expected, name)
            print('PASS', name)
    print('MANUAL_PREFLIGHT_CONTRACT=PASS (11 simulated dispatch cases; no live dispatch)')
    if args.api_root:
        full_recipe(scripts,args.api_root.resolve(),args.frontend_root.resolve())


if __name__ == '__main__':
    main()
