#!/usr/bin/env python3
"""Fail if tracked environment files contain non-placeholder secret values.
Never prints secret values, lengths, hashes, or prefixes.
"""
from __future__ import annotations
import json, re, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SENSITIVE=re.compile(r"(PASSWORD|PASSWD|SECRET|TOKEN|PRIVATE_KEY|API_KEY|MAGIC_SECRET_KEY)$",re.I)
PLACEHOLDER=re.compile(
    r"^(?:"
    r"$|"
    r"CHANGER(?:_|$).*|"
    r"CHANGE(?:_|$).*|"
    r"YOUR(?:_|$).*|"
    r"EXAMPLE(?:_|$).*|"
    r"PLACEHOLDER(?:_|$).*|"
    r"<[^>]+>|"
    r"\$\{[^}]+\}|"
    r"X{3,}"
    r")$",
    re.I,
)

def tracked_env_files():
    raw=subprocess.check_output(["git","-C",str(ROOT),"ls-files"],text=True)
    out=[]
    for rel in raw.splitlines():
        name=Path(rel).name
        if name==".env" or name.startswith(".env."):
            if name==".env.example":
                continue
            out.append(rel)
    return sorted(out)

findings=[]
for rel in tracked_env_files():
    p=ROOT/rel
    for line_no,line in enumerate(p.read_text(encoding="utf-8",errors="ignore").splitlines(),1):
        t=line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        key,value=t.split("=",1)
        key=key.strip()
        value=value.strip().strip("\"'")
        if SENSITIVE.search(key) and not PLACEHOLDER.match(value):
            findings.append({"path":rel,"line":line_no,"key":key,"classification":"NON_PLACEHOLDER_SECRET_VALUE"})

report={
    "schema_version":"1.0.0",
    "project_uid":"CS-AFRICAFUNDS-001",
    "tracked_env_files":tracked_env_files(),
    "finding_count":len(findings),
    "findings":findings,
    "values_exposed_in_report":False,
    "result":"PASS" if not findings else "SECURITY_GATE",
}
print(json.dumps(report,indent=2))
Path(".governance-secret-audit.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
raise SystemExit(1 if findings else 0)
