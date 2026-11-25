#!/usr/bin/env python3
"""Exercise AF-TASK-028 dispatch guards without network, tokens or repository writes."""
import os
import re
import subprocess
import tempfile
from pathlib import Path


def require(condition, label):
    if not condition:
        raise AssertionError(label)


def main():
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


if __name__ == '__main__':
    main()
