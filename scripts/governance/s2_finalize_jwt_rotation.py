#!/usr/bin/env python3
"""Finalize JWT incident response by disabling the exposed previous signing key.
Transactional and non-disclosing.
"""
from __future__ import annotations
import json, os, shutil, stat, subprocess, time
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
ENV=ROOT/".env"
PROCESS="api-monolith"
BRANCH="claude/code-review-improvements-ikvuj"

def run(cmd,env=None,timeout=30):
    return subprocess.run(cmd,cwd=str(ROOT),env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)

def load_env():
    raw=ENV.read_text(encoding="utf-8")
    vals={}
    for line in raw.splitlines():
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        k,v=t.split("=",1)
        vals[k.strip()]=v.strip().strip("\"'")
    return raw,vals

def replace_or_add(raw,key,value):
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
        out.append(key+"="+value)
    return "\n".join(out)+"\n"

def restart():
    p=run(["pm2","restart",PROCESS],timeout=30)
    if p.returncode!=0: raise RuntimeError("pm2 restart failed")
    time.sleep(2)

def wait_http(attempts=15,delay=2):
    last="000"
    for _ in range(attempts):
        p=run(["curl","-sS","-o","/dev/null","-w","%{http_code}","--max-time","20","http://localhost:3005/api/getactualite"],timeout=25)
        last=p.stdout.strip()
        if last.startswith("2"): return last
        time.sleep(delay)
    return last

def make_token(secret):
    env=os.environ.copy(); env["PROBE_SECRET"]=secret
    code="const jwt=require('jsonwebtoken');process.stdout.write(jwt.sign({rotationFinalize:true},process.env.PROBE_SECRET,{expiresIn:'5m'}));"
    p=run(["node","-e",code],env=env,timeout=15)
    if p.returncode!=0 or not p.stdout: raise RuntimeError("probe token generation failed")
    return p.stdout

def verify_state(current_token,old_token):
    env=os.environ.copy()
    env["PROBE_CURRENT_TOKEN"]=current_token
    env["PROBE_OLD_TOKEN"]=old_token
    code=r"""
require('dotenv').config({path:'.env'});
const {verifyJwt}=require('./src/lib/jwt-rotation');
let currentOk=false, oldRejected=false;
try { currentOk=verifyJwt(process.env.PROBE_CURRENT_TOKEN).rotationFinalize===true; } catch (_) {}
try { verifyJwt(process.env.PROBE_OLD_TOKEN); } catch (_) { oldRejected=true; }
if (!currentOk || !oldRejected || process.env.JWT_SECRET_PREVIOUS) process.exit(30);
console.log('JWT_PREVIOUS_KEY_DISABLED=PASS');
"""
    p=run(["node","-e",code],env=env,timeout=20)
    return p.returncode==0

def main():
    if os.geteuid()!=0: raise RuntimeError("must run as root")
    if run(["git","branch","--show-current"]).stdout.strip()!=BRANCH: raise RuntimeError("wrong branch")
    if run(["git","ls-files","--error-unmatch",".env"]).returncode==0: raise RuntimeError(".env must be untracked")
    raw,vals=load_env()
    current=vals.get("JWT_SECRET")
    previous=vals.get("JWT_SECRET_PREVIOUS")
    if not current or not previous or current==previous:
        raise RuntimeError("expected active current+previous JWT keys")

    current_token=make_token(current)
    old_token=make_token(previous)

    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup=Path("/var/backups/africafunds-secrets")/stamp
    backup.mkdir(parents=True,exist_ok=False)
    os.chmod(backup,0o700)
    backup_env=backup/"runtime.env.before-jwt-previous-disable"
    shutil.copyfile(ENV,backup_env); os.chmod(backup_env,0o600)

    changed=False
    try:
        updated=replace_or_add(raw,"JWT_SECRET_PREVIOUS","")
        tmp=ENV.with_name(".env.jwt.finalize.tmp")
        tmp.write_text(updated,encoding="utf-8"); os.chmod(tmp,0o600); os.replace(tmp,ENV)
        changed=True
        restart()
        http=wait_http()
        if not http.startswith("2"): raise RuntimeError("API failed after previous-key disable")
        if not verify_state(current_token,old_token): raise RuntimeError("JWT revocation probe failed")
        print(json.dumps({
          "schema_version":"1.0.0",
          "project_uid":"CS-AFRICAFUNDS-001",
          "result":"PASS",
          "credential":"JWT_SECRET_PREVIOUS",
          "previous_key_active":False,
          "current_token_valid":True,
          "old_key_token_rejected":True,
          "old_sessions_revoked":True,
          "local_api_http":http,
          "runtime_env_mode":oct(stat.S_IMODE(ENV.stat().st_mode)),
          "secret_values_exposed":False,
          "token_values_exposed":False,
          "rollback_used":False,
          "backup_path":str(backup)
        },indent=2))
    except Exception as exc:
        try:
            if changed:
                shutil.copyfile(backup_env,ENV); os.chmod(ENV,0o600)
            restart(); http=wait_http()
        except Exception:
            http="UNKNOWN"
        print(json.dumps({
          "schema_version":"1.0.0",
          "project_uid":"CS-AFRICAFUNDS-001",
          "result":"ROLLED_BACK",
          "local_api_http_after_rollback":http,
          "secret_values_exposed":False,
          "token_values_exposed":False,
          "rollback_used":True,
          "error_class":type(exc).__name__
        },indent=2))
        raise

if __name__=="__main__":
    main()
