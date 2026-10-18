#!/usr/bin/env python3
"""Read-only DB rotation detail: PM2 env-key presence and DB privilege scope.
Never emits secret values, hashes, prefixes, or lengths.
"""
from __future__ import annotations
import json, subprocess
from pathlib import Path

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")

def run(cmd, timeout=20):
    p=subprocess.run(cmd,cwd=str(ROOT),text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)
    return p.returncode,p.stdout.strip(),p.stderr.strip()

def env_map():
    out={}
    for line in (ROOT/".env").read_text(encoding="utf-8",errors="ignore").splitlines():
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        k,v=t.split("=",1)
        out[k.strip()]=v.strip().strip("\"'")
    return out

def pm2_rows():
    code,raw,err=run(["pm2","jlist"])
    start=raw.find("[")
    if start<0:
        return {"parse":"FAIL","error":"JSON_ARRAY_NOT_FOUND","processes":[]}
    rows=json.loads(raw[start:])
    keys=["DB_USER","DB_PASSWORD","DB_HOST","DB_NAME","JWT_SECRET","EMAIL_PASSWORD","MAGIC_SECRET_KEY"]
    out=[]
    for row in rows:
        e=row.get("pm2_env") or {}
        envblock=e.get("env") or {}
        out.append({
            "name":row.get("name"),
            "status":e.get("status"),
            "cwd":e.get("pm_cwd"),
            "node_version":e.get("node_version"),
            "sensitive_env_presence":{
                k:(k in envblock or k in e) for k in keys
            }
        })
    return {"parse":"PASS","processes":out}

def db_scope(user):
    esc=user.replace("'","''")
    code,schema,err=run(["mysql","-N","-B","-e",
        "SELECT REPLACE(GRANTEE,'''',''),TABLE_SCHEMA,PRIVILEGE_TYPE "
        "FROM information_schema.SCHEMA_PRIVILEGES "
        "WHERE GRANTEE LIKE CONCAT(QUOTE('"+esc+"'),'@%') "
        "ORDER BY TABLE_SCHEMA,PRIVILEGE_TYPE;"])
    code2,procs,err2=run(["mysql","-N","-B","-e",
        "SELECT COALESCE(DB,'NULL'),COUNT(*) FROM information_schema.PROCESSLIST "
        "WHERE USER='"+esc+"' GROUP BY DB ORDER BY DB;"])
    return {
        "schema_privileges":[
            {"grantee":p[0],"schema":p[1],"privilege":p[2]}
            for line in schema.splitlines() if line.strip()
            for p in [line.split("\t")]
        ],
        "process_databases":[
            {"database":p[0],"count":int(p[1])}
            for line in procs.splitlines() if line.strip()
            for p in [line.split("\t")]
        ]
    }

env=env_map()
user=env.get("DB_USER","")
report={
    "schema_version":"1.0.0",
    "project_uid":"CS-AFRICAFUNDS-001",
    "configured_db_user":user,
    "pm2":pm2_rows(),
    "db_scope":db_scope(user),
    "safety":{
        "read_only":True,
        "secret_values_exposed":False,
        "secret_hashes_exposed":False,
        "database_modified":False,
        "services_restarted":False
    }
}
print(json.dumps(report,ensure_ascii=False,indent=2))
