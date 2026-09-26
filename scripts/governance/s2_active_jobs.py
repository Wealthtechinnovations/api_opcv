#!/usr/bin/env python3
"""List only active AfricaFunds sensitive job script paths/PIDs, never arguments."""
from __future__ import annotations
import json,re,subprocess
p=subprocess.run(["ps","-eo","pid=,args="],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
rows=[]
pat=re.compile(r"(scripts/(?:cron|fix|import|recalc|scraper)/[^\s]+)")
for line in p.stdout.splitlines():
    m=pat.search(line)
    if not m:
        continue
    if "s2_rotate_db_password.py" in line or "s2_active_jobs.py" in line:
        continue
    parts=line.strip().split(None,1)
    rows.append({"pid":int(parts[0]),"script":m.group(1)})
print(json.dumps({
  "schema_version":"1.0.0",
  "project_uid":"CS-AFRICAFUNDS-001",
  "active_sensitive_jobs":rows,
  "count":len(rows),
  "arguments_exposed":False
},indent=2))
