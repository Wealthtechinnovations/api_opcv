#!/usr/bin/env python3
"""Read-only preflight for rotating AfricaFunds local/runtime credentials.
No secret values, hashes or lengths are emitted.
"""
from __future__ import annotations
import json, re, subprocess
from collections import Counter
from pathlib import Path

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")

def run(cmd,cwd=ROOT,timeout=20):
    try:
        p=subprocess.run(cmd,cwd=str(cwd),text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)
        return {"code":p.returncode,"stdout":p.stdout.strip(),"stderr":p.stderr.strip()}
    except Exception as e:
        return {"code":999,"stdout":"","stderr":type(e).__name__}

def env_keys():
    vals={}
    p=ROOT/".env"
    for line in p.read_text(encoding="utf-8",errors="ignore").splitlines():
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t: continue
        k,v=t.split("=",1)
        vals[k.strip()]=v.strip().strip("\"'")
    return vals

def pm2():
    r=run(["pm2","jlist"])
    raw=r["stdout"]
    start=raw.find("[")
    if start<0:
        return {"parse":"FAIL","command_code":r["code"],"error":"JSON_ARRAY_NOT_FOUND"}
    try:
        rows=json.loads(raw[start:])
    except Exception:
        # Try from the last plausible JSON array line.
        lines=raw.splitlines()
        payload=next((x for x in reversed(lines) if x.lstrip().startswith("[")),None)
        if payload is None:
            return {"parse":"FAIL","command_code":r["code"],"error":"JSON_PARSE_FAILED"}
        rows=json.loads(payload)
    out=[]
    for row in rows:
        e=row.get("pm2_env") or {}
        out.append({
            "name":row.get("name"),
            "pid":row.get("pid"),
            "status":e.get("status"),
            "restarts":e.get("restart_time"),
            "cwd":e.get("pm_cwd"),
            "script":e.get("pm_exec_path"),
            "interpreter":e.get("exec_interpreter"),
            "node_version":e.get("node_version"),
        })
    return {"parse":"PASS","processes":out}

def mysql_root():
    # SSH runs as root on S2. Local MariaDB root may use unix_socket auth.
    version=run(["mysql","-N","-B","-e","SELECT VERSION();"])
    if version["code"]!=0:
        return {"root_socket_access":"FAIL","error":"LOCAL_ROOT_SQL_UNAVAILABLE"}
    users=run(["mysql","-N","-B","-e","SELECT User,Host,plugin FROM mysql.user ORDER BY User,Host;"])
    procs=run(["mysql","-N","-B","-e","SELECT USER,COUNT(*) FROM information_schema.PROCESSLIST GROUP BY USER ORDER BY USER;"])
    return {
        "root_socket_access":"PASS",
        "version":version["stdout"],
        "accounts":[
            {"user":p[0],"host":p[1],"plugin":p[2] if len(p)>2 else None}
            for line in users["stdout"].splitlines() if line.strip()
            for p in [line.split("\t")]
        ],
        "connections_by_user":[
            {"user":p[0],"count":int(p[1])}
            for line in procs["stdout"].splitlines() if line.strip()
            for p in [line.split("\t")]
        ],
    }

def grep_paths(pattern):
    r=run(["git","grep","-l","-E",pattern,"--",":(exclude).env*",":(exclude).governance/knowledge/markdown-registry.json"])
    if r["code"] not in (0,1): return []
    return sorted(set(x for x in r["stdout"].splitlines() if x.strip()))

env=env_keys()
db_user=env.get("DB_USER","")
hardcoded=[]
if db_user:
    hardcoded=grep_paths(re.escape(db_user))
jwt_paths=grep_paths(r"JWT_SECRET|jwt\.(verify|sign)")
email_paths=grep_paths(r"EMAIL_PASSWORD|SMTP_PASS")
magic_paths=grep_paths(r"MAGIC_SECRET_KEY")

report={
    "schema_version":"1.0.0",
    "project_uid":"CS-AFRICAFUNDS-001",
    "db":{
        "configured_user":db_user,
        "configured_host":env.get("DB_HOST"),
        "configured_database":env.get("DB_NAME"),
        "mysql":mysql_root(),
        "configured_user_literal_paths":hardcoded,
        "configured_user_literal_path_count":len(hardcoded),
    },
    "pm2":pm2(),
    "jwt":{
        "consumer_paths":jwt_paths,
        "consumer_path_count":len(jwt_paths),
        "rotation_effect":"Existing tokens signed only with the old key will stop verifying unless compatibility logic is added."
    },
    "email":{
        "consumer_paths":email_paths,
        "consumer_path_count":len(email_paths),
        "provider_rotation":"EXTERNAL_PROVIDER_REQUIRED"
    },
    "magic":{
        "consumer_paths":magic_paths,
        "consumer_path_count":len(magic_paths),
        "provider_rotation":"EXTERNAL_PROVIDER_REQUIRED"
    },
    "safety":{
        "read_only":True,
        "secret_values_exposed":False,
        "secret_hashes_exposed":False,
        "database_modified":False,
        "services_restarted":False
    }
}
print(json.dumps(report,ensure_ascii=False,indent=2))
