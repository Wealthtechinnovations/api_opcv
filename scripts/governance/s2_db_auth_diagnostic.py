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


def process_details():
    """Project-related processes with ancestry/cwd only; never emit env values."""
    code,out,err=run(["ps","-eo","pid=,ppid=,comm=,lstart=,args="],timeout=10)
    rows=[]
    for line in out.splitlines():
        low=line.lower()
        if "africafunds.chainsolutions.fr/api" not in low and "fund_opcvm" not in low and "api-monolith" not in low:
            continue
        parts=line.strip().split(None,8)
        if len(parts)<3:
            continue
        pid=parts[0]
        cwd=""
        try:
            cwd=str(Path(f"/proc/{pid}/cwd").resolve())
        except Exception:
            cwd="UNKNOWN"
        rows.append({
            "pid":int(pid) if pid.isdigit() else pid,
            "ppid":int(parts[1]) if parts[1].isdigit() else parts[1],
            "comm":parts[2],
            "cwd":cwd,
            "cmdline":sanitize(parts[8] if len(parts)>8 else line.strip())[:700],
        })
    return rows[:120]

def stale_env_reference_files():
    """Find actual loaders/references of .env.production* without exposing values."""
    patterns=(".env.production.plan-b",".env.production")
    roots=[
        API,
        Path("/etc/systemd/system"),
        Path("/lib/systemd/system"),
        Path("/etc/cron.d"),
        Path("/root/.pm2"),
    ]
    rows=[]
    seen=set()
    for root in roots:
        if not root.exists():
            continue
        candidates=[]
        if root.is_file():
            candidates=[root]
        else:
            try:
                candidates=[p for p in root.rglob("*") if p.is_file()]
            except Exception:
                continue
        for p in candidates:
            sp=str(p)
            if "/node_modules/" in sp or "/.git/" in sp:
                continue
            # Logs are evidence only in a separate function, not loader proof.
            if p.suffix.lower()==".log":
                continue
            try:
                if p.stat().st_size > 5_000_000:
                    continue
                txt=p.read_text(encoding="utf-8",errors="ignore")
            except Exception:
                continue
            matched=[pat for pat in patterns if pat in txt]
            if not matched:
                continue
            key=(sp,tuple(matched))
            if key in seen:
                continue
            seen.add(key)
            lines=[]
            for n,line in enumerate(txt.splitlines(),1):
                if any(pat in line for pat in patterns):
                    lines.append({"line":n,"text":sanitize(line.strip())[:500]})
                    if len(lines)>=8:
                        break
            rows.append({"path":sp,"patterns":matched,"matches":lines})
    return rows[:200]

def auth_error_log_attribution():
    """Search project/PM2 logs for the same DB auth error, by filename and time."""
    roots=[Path("/root/.pm2/logs"), API]
    rows=[]
    seen=set()
    for root in roots:
        if not root.exists():
            continue
        try:
            candidates=[p for p in root.rglob("*.log") if p.is_file()]
        except Exception:
            continue
        for p in candidates:
            sp=str(p)
            if sp in seen:
                continue
            seen.add(sp)
            try:
                if p.stat().st_size > 200_000_000:
                    # tail only for very large logs
                    code,out,err=run(["tail","-n","20000",sp],timeout=20)
                    txt=out
                else:
                    txt=p.read_text(encoding="utf-8",errors="ignore")
            except Exception:
                continue
            matches=[sanitize(x.strip())[:700] for x in txt.splitlines() if PAT.search(x)]
            if matches:
                rows.append({
                    "path":sp,
                    "count_in_scanned_window":len(matches),
                    "first":matches[0],
                    "last":matches[-1],
                    "mtime_utc":datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat(),
                })
    return rows[:100]

def pm2_loader_contract():
    """Expose PM2 loader structure, not secret values."""
    paths=[Path("/root/.pm2/dump.pm2")]
    out=[]
    for p in paths:
        if not p.exists():
            continue
        try:
            data=json.loads(p.read_text(encoding="utf-8",errors="ignore"))
        except Exception as exc:
            out.append({"path":str(p),"parse":"FAIL","error":type(exc).__name__})
            continue
        for row in data if isinstance(data,list) else []:
            name=row.get("name")
            if name not in {"api-monolith","worker-recalculation","worker-data-import","fundafrique-frontend"}:
                continue
            env=row.get("env") or {}
            out.append({
                "path":str(p),
                "parse":"PASS",
                "name":name,
                "cwd":row.get("pm_cwd"),
                "script":row.get("pm_exec_path"),
                "args":sanitize(str(row.get("args") or ""))[:500],
                "env_keys_present":[k for k in ["DB_USER","DB_PASSWORD","DB_HOST","DB_NAME","NODE_ENV","ENV_FILE"] if k in env],
                "stale_env_literal_present": any(".env.production" in str(v) for v in row.values() if isinstance(v,(str,list,dict))),
            })
    return out

def systemd_environment_files():
    rows=[]
    for unit in ("mariadb","api-monolith","africafunds","pm2-root"):
        code,out,err=run(["systemctl","cat",unit],timeout=10)
        if code!=0:
            continue
        vals=[]
        for line in out.splitlines():
            s=line.strip()
            if s.startswith("EnvironmentFile=") or ".env.production" in s:
                vals.append(sanitize(s)[:500])
        if vals:
            rows.append({"unit":unit,"lines":vals})
    return rows

def stale_env_open_fds():
    rows=[]
    for fdroot in Path("/proc").glob("[0-9]*/fd"):
        pid=fdroot.parent.name
        try:
            for fd in fdroot.iterdir():
                try:
                    target=str(fd.resolve())
                except Exception:
                    continue
                if ".env.production" in target:
                    rows.append({"pid":int(pid),"fd":fd.name,"target":target})
        except Exception:
            continue
    return rows[:100]


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
    "process_details":process_details(),
    "stale_env_reference_files":stale_env_reference_files(),
    "auth_error_log_attribution":auth_error_log_attribution(),
    "pm2_loader_contract":pm2_loader_contract(),
    "systemd_environment_files":systemd_environment_files(),
    "stale_env_open_fds":stale_env_open_fds(),
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
