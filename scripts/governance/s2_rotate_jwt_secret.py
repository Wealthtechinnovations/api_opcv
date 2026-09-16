#!/usr/bin/env python3
"""Transactional, backward-compatible JWT secret rotation on S2.
Keeps the old key verification-only as JWT_SECRET_PREVIOUS.
No secret or token value is emitted.
"""
from __future__ import annotations
import json, os, secrets, shutil, stat, subprocess, time
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
ENV=ROOT/".env"
BRANCH="claude/code-review-improvements-ikvuj"
PROCESS="api-monolith"

def run(cmd,env=None,timeout=30):
    return subprocess.run(cmd,cwd=str(ROOT),env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)

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

def restart_api():
    p=run(["pm2","restart",PROCESS],timeout=30)
    if p.returncode!=0:
        raise RuntimeError("pm2 restart failed")
    time.sleep(3)
    state=run(["pm2","jlist"],timeout=20)
    start=state.stdout.find("[")
    if start<0:
        raise RuntimeError("pm2 JSON unavailable")
    rows=json.loads(state.stdout[start:])
    status={x.get("name"):(x.get("pm2_env") or {}).get("status") for x in rows}
    if status.get(PROCESS)!="online":
        raise RuntimeError("api-monolith not online")

def http_code():
    p=run(["curl","-sS","-o","/dev/null","-w","%{http_code}","--max-time","20","http://localhost:3005/api/getactualite"],timeout=25)
    return p.stdout.strip()

def wait_http(attempts=15, delay=2):
    last="000"
    for _ in range(attempts):
        last=http_code()
        if last.startswith("2"):
            return last
        time.sleep(delay)
    return last

def node_probe(old_secret,old_token):
    env=os.environ.copy()
    env["ROTATION_OLD_SECRET"]=old_secret
    env["ROTATION_OLD_TOKEN"]=old_token
    code=r"""
require('dotenv').config({path:'.env'});
const jwt=require('jsonwebtoken');
const {signJwt,verifyJwt}=require('./src/lib/jwt-rotation');
const old=process.env.ROTATION_OLD_SECRET;
const oldToken=process.env.ROTATION_OLD_TOKEN;
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET_PREVIOUS) process.exit(30);
if (process.env.JWT_SECRET === process.env.JWT_SECRET_PREVIOUS) process.exit(31);
const oldDecoded=verifyJwt(oldToken);
if (!oldDecoded || oldDecoded.rotationProbe !== true) process.exit(32);
const newToken=signJwt({rotationProbe:true},{expiresIn:'5m'});
const currentDecoded=jwt.verify(newToken,process.env.JWT_SECRET);
if (!currentDecoded.rotationProbe) process.exit(33);
let rejected=false;
try { jwt.verify(newToken,old); } catch (_) { rejected=true; }
if (!rejected) process.exit(34);
console.log('JWT_ROTATION_COMPATIBILITY=PASS');
"""
    p=run(["node","-e",code],env=env,timeout=20)
    return p.returncode==0

def make_old_token(old_secret):
    env=os.environ.copy()
    env["ROTATION_OLD_SECRET"]=old_secret
    code="const jwt=require('jsonwebtoken'); process.stdout.write(jwt.sign({rotationProbe:true},process.env.ROTATION_OLD_SECRET,{expiresIn:'5m'}));"
    p=run(["node","-e",code],env=env,timeout=15)
    if p.returncode!=0 or not p.stdout:
        raise RuntimeError("old-token probe generation failed")
    return p.stdout

def main():
    if os.geteuid()!=0:
        raise RuntimeError("must run as root")
    if run(["git","branch","--show-current"]).stdout.strip()!=BRANCH:
        raise RuntimeError("wrong branch")
    if run(["git","ls-files","--error-unmatch",".env"]).returncode==0:
        raise RuntimeError(".env must remain untracked")
    if run(["git","check-ignore","--no-index",".env"]).returncode!=0:
        raise RuntimeError(".env must be ignored")
    if not (ROOT/"src/lib/jwt-rotation.js").exists():
        raise RuntimeError("dual-key JWT helper not deployed")

    raw,vals=load_env(ENV)
    old=vals.get("JWT_SECRET")
    previous=vals.get("JWT_SECRET_PREVIOUS","")
    if not old:
        raise RuntimeError("JWT_SECRET missing")
    if previous:
        raise RuntimeError("JWT_SECRET_PREVIOUS already populated; refusing to overwrite compatibility key")

    # Load the new dual-key code first while still using the old key.
    restart_api()
    before=wait_http()
    if not before.startswith("2"):
        raise RuntimeError("API failed after code-only restart")
    old_token=make_old_token(old)

    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup=Path("/var/backups/africafunds-secrets")/stamp
    backup.mkdir(parents=True,exist_ok=False)
    os.chmod(backup,0o700)
    backup_env=backup/"runtime.env.before-jwt-rotation"
    shutil.copyfile(ENV,backup_env)
    os.chmod(backup_env,0o600)

    new=secrets.token_hex(64)
    changed=False
    try:
        updated=replace_or_add(raw,"JWT_SECRET_PREVIOUS",old)
        updated=replace_or_add(updated,"JWT_SECRET",new)
        tmp=ENV.with_name(".env.jwt.rotate.tmp")
        tmp.write_text(updated,encoding="utf-8")
        os.chmod(tmp,0o600)
        os.replace(tmp,ENV)
        changed=True

        restart_api()
        after=wait_http()
        if not after.startswith("2"):
            raise RuntimeError("API failed after JWT rotation")
        if not node_probe(old,old_token):
            raise RuntimeError("JWT compatibility probe failed")

        print(json.dumps({
          "schema_version":"1.0.0",
          "project_uid":"CS-AFRICAFUNDS-001",
          "result":"PASS",
          "credential":"JWT_SECRET",
          "new_key_active":True,
          "previous_key_verification_enabled":True,
          "old_token_still_valid":True,
          "new_token_rejected_by_old_key":True,
          "api_monolith_online":True,
          "local_api_http":after,
          "runtime_env_mode":oct(stat.S_IMODE(ENV.stat().st_mode)),
          "backup_path":str(backup),
          "secret_values_exposed":False,
          "token_values_exposed":False,
          "rollback_used":False,
          "previous_key_cleanup":"DEFER_UNTIL_MAX_TOKEN_TTL_EXPIRED"
        },indent=2))
    except Exception as exc:
        try:
            if changed:
                shutil.copyfile(backup_env,ENV)
                os.chmod(ENV,0o600)
            restart_api()
            rollback_http=wait_http()
        except Exception:
            rollback_http="UNKNOWN"
        print(json.dumps({
          "schema_version":"1.0.0",
          "project_uid":"CS-AFRICAFUNDS-001",
          "result":"ROLLED_BACK",
          "credential":"JWT_SECRET",
          "local_api_http_after_rollback":rollback_http,
          "secret_values_exposed":False,
          "token_values_exposed":False,
          "rollback_used":True,
          "error_class":type(exc).__name__
        },indent=2))
        raise

if __name__=="__main__":
    main()
