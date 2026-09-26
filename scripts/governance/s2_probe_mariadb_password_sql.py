#!/usr/bin/env python3
"""Probe MariaDB password-change syntax on a temporary account only.
No application account or business data is modified.
"""
from __future__ import annotations
import json, os, secrets, subprocess

PROBE_USER="africafunds_rotation_probe"
PROBE_HOST="localhost"

def run(cmd,env=None,timeout=20):
    return subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,timeout=timeout,check=False)

def root(sql):
    return run(["mysql","-N","-B","-e",sql])

def login(password):
    env=os.environ.copy()
    env["MYSQL_PWD"]=password
    return run(["mysql","-N","-B","-u",PROBE_USER,"-e","SELECT 1;"],env=env).returncode==0

def set_password_hex(password):
    hx=password.encode("utf-8").hex()
    sql=(
        "SET @af_pwd=CONVERT(0x"+hx+" USING utf8mb4);"
        "SET @af_sql=CONCAT(\"ALTER USER '"+PROBE_USER+"'@'"+PROBE_HOST+"' IDENTIFIED BY \",QUOTE(@af_pwd));"
        "PREPARE af_stmt FROM @af_sql;"
        "EXECUTE af_stmt;"
        "DEALLOCATE PREPARE af_stmt;"
        "FLUSH PRIVILEGES;"
    )
    return root(sql).returncode==0

result={"schema_version":"1.0.0","project_uid":"CS-AFRICAFUNDS-001","temporary_account_only":True}
initial=secrets.token_hex(24)
special="Af!"+secrets.token_hex(8)+"'\\ ; é"
second=secrets.token_hex(32)
try:
    root("DROP USER IF EXISTS '"+PROBE_USER+"'@'"+PROBE_HOST+"';")
    c=root("CREATE USER '"+PROBE_USER+"'@'"+PROBE_HOST+"' IDENTIFIED BY '"+initial+"';")
    if c.returncode!=0:
        raise RuntimeError("probe create failed")
    result["initial_login"]=login(initial)

    result["server_side_quote_method"]=set_password_hex(special)
    result["special_password_login"]=login(special) if result["server_side_quote_method"] else False
    result["old_password_rejected_after_special"]=not login(initial) if result["server_side_quote_method"] else False

    result["second_rotation_method"]=set_password_hex(second)
    result["second_password_login"]=login(second) if result["second_rotation_method"] else False
    result["special_password_rejected_after_second"]=not login(special) if result["second_rotation_method"] else False
    result["recommended_method"]="SERVER_SIDE_QUOTE_FROM_HEX" if all([
        result["initial_login"],result["server_side_quote_method"],result["special_password_login"],
        result["old_password_rejected_after_special"],result["second_rotation_method"],
        result["second_password_login"],result["special_password_rejected_after_second"]
    ]) else "NONE"
finally:
    drop=root("DROP USER IF EXISTS '"+PROBE_USER+"'@'"+PROBE_HOST+"';")
    result["temporary_account_removed"]=drop.returncode==0

result["secret_values_exposed"]=False
result["business_data_modified"]=False
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(0 if result.get("recommended_method")=="SERVER_SIDE_QUOTE_FROM_HEX" and result["temporary_account_removed"] else 1)
