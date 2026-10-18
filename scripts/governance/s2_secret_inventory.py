#!/usr/bin/env python3
"""Read-only inventory of AfricaFunds runtime secret/config loading on S2.
Never emits secret values, prefixes, hashes, or lengths.
"""
from __future__ import annotations
import json, os, pwd, grp, re, stat, subprocess
from pathlib import Path

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
FILES=[".env",".env.production",".env.production.plan-b",".env.example"]
SENSITIVE=re.compile(r"(PASSWORD|PASSWD|SECRET|TOKEN|PRIVATE_KEY|API_KEY|MAGIC_SECRET_KEY)$",re.I)
PLACEHOLDER=re.compile(
    r"^(?:$|CHANGER(?:_|$).*|CHANGE(?:_|$).*|YOUR(?:_|$).*|EXAMPLE(?:_|$).*|"
    r"PLACEHOLDER(?:_|$).*|<[^>]+>|\$\{[^}]+\}|X{3,})$",
    re.I,
)

def run(args, cwd=ROOT, binary=False):
    p=subprocess.run(
        args,cwd=str(cwd),stdout=subprocess.PIPE,stderr=subprocess.PIPE,
        check=False,text=not binary
    )
    return p

def parse_env(path: Path):
    keys=[]
    sensitive_nonplaceholder=[]
    if not path.exists():
        return keys,sensitive_nonplaceholder
    for line in path.read_text(encoding="utf-8",errors="ignore").splitlines():
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        key,value=t.split("=",1)
        key=key.strip()
        value=value.strip().strip("\"'")
        keys.append(key)
        if SENSITIVE.search(key) and not PLACEHOLDER.match(value):
            sensitive_nonplaceholder.append(key)
    return sorted(set(keys)),sorted(set(sensitive_nonplaceholder))

def git_tracked(rel):
    return run(["git","ls-files","--error-unmatch",rel]).returncode==0

def git_status(rel):
    p=run(["git","status","--porcelain=v1","--",rel])
    return [x for x in p.stdout.splitlines() if x.strip()]

def matches_head(rel,path):
    if not git_tracked(rel) or not path.exists():
        return None
    p=run(["git","show","HEAD:"+rel],binary=True)
    if p.returncode!=0:
        return None
    return p.stdout==path.read_bytes()

def metadata(rel):
    path=ROOT/rel
    out={"path":rel,"exists":path.exists()}
    if not path.exists():
        return out
    st=path.stat()
    keys,secret_keys=parse_env(path)
    out.update({
        "tracked_by_git":git_tracked(rel),
        "git_status":git_status(rel),
        "matches_git_head":matches_head(rel,path),
        "mode":oct(stat.S_IMODE(st.st_mode)),
        "owner":pwd.getpwuid(st.st_uid).pw_name,
        "group":grp.getgrgid(st.st_gid).gr_name,
        "keys":keys,
        "sensitive_nonplaceholder_keys":secret_keys,
        "values_exposed":False,
    })
    return out

def code_consumers():
    patterns=["*.js","*.ts","*.cjs","*.mjs","*.sh"]
    cmd=["git","grep","-l","-E","dotenv|\\.env|DOTENV_CONFIG_PATH","--"]+patterns
    p=run(cmd)
    if p.returncode not in (0,1):
        return []
    return sorted(set(x.strip() for x in p.stdout.splitlines() if x.strip()))

def pm2_processes():
    p=run(["ps","-eo","pid=,comm=,args="])
    rows=[]
    if p.returncode!=0:
        return rows
    for line in p.stdout.splitlines():
        low=line.lower()
        if "africafunds" in low or "api-monolith" in low or "fundafrique-frontend" in low:
            # args may include paths but must not include environment values.
            parts=line.strip().split(None,2)
            rows.append({
                "pid":parts[0] if parts else None,
                "comm":parts[1] if len(parts)>1 else None,
                "args":parts[2][:500] if len(parts)>2 else None,
            })
    return rows[:50]

def git_ignore_probe(rel):
    p=run(["git","check-ignore","--no-index","-v",rel])
    return p.stdout.strip() if p.returncode==0 else None

files={rel:metadata(rel) for rel in FILES}
example=set(files.get(".env.example",{}).get("keys",[]))
runtime=set(files.get(".env",{}).get("keys",[]))
report={
    "schema_version":"1.0.0",
    "project_uid":"CS-AFRICAFUNDS-001",
    "root":str(ROOT),
    "files":files,
    "runtime_env_key_count":len(runtime),
    "example_key_count":len(example),
    "runtime_keys_missing_from_example":sorted(runtime-example),
    "example_keys_missing_from_runtime":sorted(example-runtime),
    "code_consumers":code_consumers(),
    "code_consumer_count":len(code_consumers()),
    "ignore_probe":{
        ".env":git_ignore_probe(".env"),
        ".env.runtime":git_ignore_probe(".env.runtime"),
        ".env.production":git_ignore_probe(".env.production"),
    },
    "processes":pm2_processes(),
    "migration_preconditions":{
        "runtime_env_exists":files[".env"].get("exists",False),
        "runtime_env_tracked":files[".env"].get("tracked_by_git",False),
        "runtime_env_matches_git_head":files[".env"].get("matches_git_head"),
        "runtime_env_git_clean":files[".env"].get("git_status",[])==[],
        "runtime_env_ignored_if_untracked":git_ignore_probe(".env") is not None,
        "backup_required":True,
        "rotation_required_if_public_secret_exposure":True,
    },
    "safety":{
        "read_only":True,
        "values_exposed":False,
        "hashes_of_secret_values_exposed":False,
        "files_modified":False,
        "services_restarted":False,
    },
}
print(json.dumps(report,ensure_ascii=False,indent=2))
