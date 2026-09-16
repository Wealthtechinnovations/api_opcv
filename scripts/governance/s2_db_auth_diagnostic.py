#!/usr/bin/env python3
"""Read-only diagnostic for stale AfricaFunds DB authentication attempts on S2.
Never emits credential values, hashes, prefixes, or lengths.
"""
from __future__ import annotations
import json,re,subprocess
from pathlib import Path
from datetime import datetime, timezone

API=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
PAT=re.compile(r"Access denied for user 'fund_opcvm'@'localhost'")
SENSITIVE=re.compile(r"(?i)(password|passwd|pwd|token|secret|api[_-]?key)\s*[=:]\s*\S+")

def run(cmd,cwd=None,timeout=20):
    p=subprocess.run(cmd,cwd=str(cwd) if cwd else None,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)
    return p.returncode,p.stdout.strip(),p.stderr.strip()

def sanitize(s):
    return SENSITIVE.sub(lambda m:m.group(1)+"=REDACTED",s)

def journal():
    code,out,err=run(["journalctl","-u","mariadb","--since","2026-09-12 00:00:00","--no-pager","-o","short-iso"],timeout=30)
    rows=[]
    for line in out.splitlines():
        if PAT.search(line):
            rows.append(line[:240])
    return rows

def cron_lines():
    rows=[]
    code,out,err=run(["crontab","-l"],timeout=10)
    for line in out.splitlines():
        t=line.strip()
        if not t or t.startswith("#"): continue
        if "africafunds" in t.lower() or "fundafrica" in t.lower() or "scripts/" in t.lower():
            rows.append(sanitize(t)[:500])
    cron_d=Path("/etc/cron.d")
    if cron_d.exists():
        for p in sorted(cron_d.iterdir()):
            if not p.is_file(): continue
            try: txt=p.read_text(encoding="utf-8",errors="ignore")
            except Exception: continue
            for line in txt.splitlines():
                t=line.strip()
                if not t or t.startswith("#"): continue
                if "africafunds" in t.lower() or "fundafrica" in t.lower():
                    rows.append(f"/etc/cron.d/{p.name}: "+sanitize(t)[:500])
    return rows

def pm2_rows():
    code,out,err=run(["pm2","jlist"],timeout=20)
    start=out.find("[")
    if code!=0 or start<0:
        return {"parse":"FAIL","error":"PM2_JSON_ARRAY_NOT_FOUND"}
    rows=json.loads(out[start:])
    names={"api-monolith","worker-recalculation","worker-data-import","fundafrique-frontend"}
    result=[]
    for row in rows:
        if row.get("name") not in names: continue
        e=row.get("pm2_env") or {}
        envblock=e.get("env") or {}
        result.append({
            "name":row.get("name"),
            "pid":row.get("pid"),
            "status":e.get("status"),
            "cwd":e.get("pm_cwd"),
            "script":e.get("pm_exec_path"),
            "sensitive_env_presence":{
                k:(k in envblock or k in e)
                for k in ["DB_USER","DB_PASSWORD","DB_HOST","DB_NAME"]
            }
        })
    return {"parse":"PASS","processes":result}

def project_processes():
    code,out,err=run(["ps","-eo","pid=,lstart=,args="],timeout=10)
    rows=[]
    for line in out.splitlines():
        low=line.lower()
        if "africafunds.chainsolutions.fr/api" in low or "fund_opcvm" in low:
            # Keep path/script visibility, redact likely inline secret material.
            rows.append(sanitize(line.strip())[:700])
    return rows[:100]

def grep_consumers():
    queries=[
        ("db_password","DB_PASSWORD"),
        ("dotenv","dotenv"),
        ("env_file",".env"),
        ("fund_opcvm","fund_opcvm")
    ]
    out={}
    for label,q in queries:
        code,stdout,stderr=run(["git","grep","-l",q,"--",":(exclude).env*",":(exclude).governance/knowledge/markdown-registry.json"],cwd=API,timeout=30)
        out[label]=sorted(x for x in stdout.splitlines() if x.strip()) if code in (0,1) else []
    return out

def mtime(path):
    p=Path(path)
    if not p.exists(): return None
    return datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat()

report={
    "schema_version":"1.0.0",
    "project_uid":"CS-AFRICAFUNDS-001",
    "mariadb_access_denied_fund_opcvm_localhost":journal(),
    "access_denied_count":len(journal()),
    "root_project_cron_lines":cron_lines(),
    "pm2":pm2_rows(),
    "project_processes":project_processes(),
    "git_consumers":grep_consumers(),
    "runtime_env":{
        "exists":(API/".env").exists(),
        "mtime_utc":mtime(API/".env"),
        "tracked":run(["git","ls-files","--error-unmatch",".env"],cwd=API)[0]==0,
        "ignored":run(["git","check-ignore","--no-index",".env"],cwd=API)[0]==0,
    },
    "safety":{
        "read_only":True,
        "secret_values_exposed":False,
        "secret_hashes_exposed":False,
        "services_restarted":False,
        "database_modified":False
    }
}
print(json.dumps(report,ensure_ascii=False,indent=2))
