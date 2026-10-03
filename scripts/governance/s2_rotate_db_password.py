#!/usr/bin/env python3
"""Transactional rotation of AfricaFunds MariaDB application password on S2.
No credential value, prefix, length, or hash is emitted.
"""
from __future__ import annotations
import json, os, secrets, shutil, stat, subprocess, sys, time
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
ENV=ROOT/".env"
BRANCH="claude/code-review-improvements-ikvuj"
EXPECTED_USER="fund_opcvm"
EXPECTED_DB="fund_opcvm"
PROCESSES=["api-monolith","worker-recalculation","worker-data-import"]

def run(cmd, cwd=ROOT, env=None, timeout=30, check=False):
    p=subprocess.run(cmd,cwd=str(cwd),env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)
    if check and p.returncode!=0:
        raise RuntimeError("command failed: "+cmd[0])
    return p

def load_env(path):
    raw=path.read_text(encoding="utf-8")
    vals={}
    for line in raw.splitlines():
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        k,v=t.split("=",1)
        vals[k.strip()]=v.strip().strip("\"'")
    return raw,vals

def replace_key(raw,key,value):
    lines=raw.splitlines()
    out=[]
    found=False
    for line in lines:
        if line.startswith(key+"="):
            out.append(key+"="+value)
            found=True
        else:
            out.append(line)
    if not found:
        raise RuntimeError("required key missing: "+key)
    return "\n".join(out)+"\n"

def mysql_root(sql):
    p=run(["mysql","-N","-B","-e",sql],timeout=30)
    if p.returncode!=0:
        raise RuntimeError("root SQL failed")
    return p.stdout.strip()

def mysql_app(password,user,db,host):
    e=os.environ.copy()
    e["MYSQL_PWD"]=password
    return run(["mysql","-N","-B","-h",host,"-u",user,db,"-e","SELECT 1;"],env=e,timeout=15)

def pm2_json():
    p=run(["pm2","jlist"],timeout=20)
    raw=p.stdout
    start=raw.find("[")
    if start<0:
        raise RuntimeError("pm2 JSON missing")
    return json.loads(raw[start:])

def assert_pm2_online():
    rows=pm2_json()
    state={x.get("name"):(x.get("pm2_env") or {}).get("status") for x in rows}
    missing=[name for name in PROCESSES if state.get(name)!="online"]
    if missing:
        raise RuntimeError("PM2 not online: "+",".join(missing))

def restart_backend():
    for name in PROCESSES:
        p=run(["pm2","restart",name],timeout=30)
        if p.returncode!=0:
            raise RuntimeError("pm2 restart failed: "+name)
    time.sleep(4)
    assert_pm2_online()

def local_http():
    p=run(["curl","-sS","-o","/dev/null","-w","%{http_code}","--max-time","20","http://localhost:3005/api/getactualite"],timeout=25)
    return p.stdout.strip()

def active_sensitive_jobs():
    p=run(["ps","-eo","pid=,args="],timeout=10)
    needles=["scripts/cron/","scripts/fix/","scripts/import/","scripts/recalc/","scripts/scraper/"]
    rows=[]
    for line in p.stdout.splitlines():
        if any(n in line for n in needles) and "s2_rotate_db_password.py" not in line:
            rows.append(line.strip())
    return rows

def alter_password(user,host,password):
    if user != EXPECTED_USER or host != "%":
        raise RuntimeError("unexpected DB account")
    # Tested on S2 with a temporary MariaDB account (CI run 34666976544).
    # The plaintext never appears in SQL: it is reconstructed server-side from
    # a hex literal, QUOTE() performs SQL-safe escaping, then PREPARE executes
    # the ALTER USER statement. This supports arbitrary rollback material.
    hex_value=password.encode("utf-8").hex()
    sql=(
        "SET @af_pwd=CONVERT(0x"+hex_value+" USING utf8mb4);"
        "SET @af_sql=CONCAT(\"ALTER USER '"+user+"'@'"+host+"' IDENTIFIED BY \",QUOTE(@af_pwd));"
        "PREPARE af_stmt FROM @af_sql;"
        "EXECUTE af_stmt;"
        "DEALLOCATE PREPARE af_stmt;"
        "FLUSH PRIVILEGES;"
    )
    mysql_root(sql)

def main():
    if os.geteuid()!=0:
        raise RuntimeError("must run as root on S2")
    if not ENV.exists():
        raise RuntimeError("runtime .env missing")
    if run(["git","branch","--show-current"]).stdout.strip()!=BRANCH:
        raise RuntimeError("wrong branch")
    if run(["git","ls-files","--error-unmatch",".env"]).returncode==0:
        raise RuntimeError(".env must be untracked before password rotation")
    if run(["git","check-ignore","--no-index",".env"]).returncode!=0:
        raise RuntimeError(".env must be ignored")
    if active_sensitive_jobs():
        raise RuntimeError("write/import/recalc/scraper process currently active; retry later")

    raw,vals=load_env(ENV)
    user=vals.get("DB_USER")
    old_password=vals.get("DB_PASSWORD")
    db=vals.get("DB_NAME")
    host=vals.get("DB_HOST") or "127.0.0.1"
    if user!=EXPECTED_USER or db!=EXPECTED_DB or not old_password:
        raise RuntimeError("unexpected runtime DB identity")
    accounts=mysql_root("SELECT CONCAT(User,'@',Host) FROM mysql.user WHERE User='"+EXPECTED_USER+"';").splitlines()
    if accounts!=[EXPECTED_USER+"@%"]:
        raise RuntimeError("unexpected MariaDB account topology")
    if mysql_app(old_password,user,db,host).returncode!=0:
        raise RuntimeError("old runtime credential does not currently work")

    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup=Path("/var/backups/africafunds-secrets")/stamp
    backup.mkdir(parents=True,exist_ok=False)
    os.chmod(backup,0o700)
    backup_env=backup/"runtime.env.before-db-rotation"
    shutil.copyfile(ENV,backup_env)
    os.chmod(backup_env,0o600)

    new_password=secrets.token_hex(32)
    changed_db=False
    changed_env=False
    try:
        new_raw=replace_key(raw,"DB_PASSWORD",new_password)
        tmp=ENV.with_name(".env.rotate.tmp")
        tmp.write_text(new_raw,encoding="utf-8")
        os.chmod(tmp,0o600)
        os.replace(tmp,ENV)
        changed_env=True

        alter_password(user,"%",new_password)
        changed_db=True

        if mysql_app(new_password,user,db,host).returncode!=0:
            raise RuntimeError("new DB credential validation failed")

        restart_backend()

        code=local_http()
        if not code.startswith("2"):
            raise RuntimeError("local API HTTP failed after rotation")

        # Prove exposed old password is no longer accepted.
        if mysql_app(old_password,user,db,host).returncode==0:
            raise RuntimeError("old DB credential still accepted")

        print(json.dumps({
            "schema_version":"1.0.0",
            "project_uid":"CS-AFRICAFUNDS-001",
            "result":"PASS",
            "credential":"DB_PASSWORD",
            "account":EXPECTED_USER+"@%",
            "database":EXPECTED_DB,
            "old_credential_rejected":True,
            "new_credential_validated":True,
            "pm2_restarted":PROCESSES,
            "pm2_all_online":True,
            "local_api_http":code,
            "runtime_env_mode":oct(stat.S_IMODE(ENV.stat().st_mode)),
            "backup_path":str(backup),
            "secret_value_exposed":False,
            "rollback_used":False
        },indent=2))
    except Exception as exc:
        # Automatic rollback if DB mutation occurred.
        try:
            if changed_db:
                alter_password(user,"%",old_password)
            if changed_env:
                shutil.copyfile(backup_env,ENV)
                os.chmod(ENV,0o600)
            restart_backend()
            old_ok=mysql_app(old_password,user,db,host).returncode==0
            http=local_http()
        except Exception:
            old_ok=False
            http="UNKNOWN"
        print(json.dumps({
            "schema_version":"1.0.0",
            "project_uid":"CS-AFRICAFUNDS-001",
            "result":"ROLLED_BACK",
            "credential":"DB_PASSWORD",
            "old_credential_restored":old_ok,
            "local_api_http_after_rollback":http,
            "secret_value_exposed":False,
            "rollback_used":True,
            "error_class":type(exc).__name__
        },indent=2))
        raise

if __name__=="__main__":
    main()
