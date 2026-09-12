#!/usr/bin/env python3
"""Read-only S2 observation for AfricaFunds. No arbitrary command input is accepted."""
from __future__ import annotations
import json, os, re, shutil, subprocess, time
from pathlib import Path

API = Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api")
FRONT = Path("/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend")
BRANCH = "claude/code-review-improvements-ikvuj"

def run(cmd, cwd=None, env=None, timeout=25):
    try:
        p = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
        return {"code": p.returncode, "stdout": p.stdout.strip(), "stderr": p.stderr.strip()}
    except Exception as exc:
        return {"code": 999, "stdout": "", "stderr": f"{type(exc).__name__}: {exc}"}

def sanitize(value):
    text = value if isinstance(value, str) else str(value)
    patterns = [
        r"(?i)(password|passwd|pwd|token|secret|api[_-]?key|private[_-]?key)\s*[=:]\s*\S+",
        r"(?i)(authorization:\s*bearer)\s+\S+",
    ]
    for pattern in patterns:
        text = re.sub(pattern, lambda m: m.group(0).split("=")[0].split(":")[0] + "=REDACTED", text)
    return text[:12000]

def git_repo(path):
    data = {"path": str(path), "exists": path.exists(), "is_git": (path / ".git").exists()}
    if not data["is_git"]:
        return data
    branch = run(["git", "branch", "--show-current"], path)["stdout"]
    head = run(["git", "rev-parse", "HEAD"], path)["stdout"]
    remote = run(["git", "ls-remote", "origin", f"refs/heads/{BRANCH}"], path)
    remote_head = remote["stdout"].split()[0] if remote["code"] == 0 and remote["stdout"] else None
    status = run(["git", "status", "--porcelain=v1"], path)["stdout"].splitlines()
    tracked = [x for x in status if not x.startswith("?? ")]
    untracked = [x[3:] for x in status if x.startswith("?? ")]
    ahead = behind = None
    if remote_head and run(["git", "cat-file", "-e", remote_head + "^{commit}"], path)["code"] == 0:
        ahead_r = run(["git", "rev-list", "--count", f"{remote_head}..HEAD"], path)
        behind_r = run(["git", "rev-list", "--count", f"HEAD..{remote_head}"], path)
        if ahead_r["code"] == 0: ahead = int(ahead_r["stdout"] or "0")
        if behind_r["code"] == 0: behind = int(behind_r["stdout"] or "0")
    return {
        **data,
        "branch": branch,
        "expected_branch": BRANCH,
        "branch_match": branch == BRANCH,
        "head": head,
        "remote_head": remote_head,
        "remote_alignment": "EXACT" if remote_head == head and remote_head else "MISMATCH_OR_UNKNOWN",
        "ahead": ahead,
        "behind": behind,
        "tracked_dirty": tracked,
        "untracked": untracked,
        "recent_commits": run(["git","log","-5","--pretty=format:%H|%cI|%s"], path)["stdout"].splitlines(),
    }

def systemd_status(names):
    out = {}
    for name in names:
        r = run(["systemctl", "is-active", name], timeout=10)
        out[name] = r["stdout"] or r["stderr"] or "unknown"
    return out

def http_probe(url):
    r = run(["curl","-sS","-L","--max-redirs","3","--max-time","20","-o","/dev/null","-w","%{http_code}|%{time_total}|%{url_effective}",url], timeout=25)
    parts = r["stdout"].split("|", 2)
    return {
        "url": url,
        "http_code": parts[0] if len(parts) > 0 else None,
        "time_total": parts[1] if len(parts) > 1 else None,
        "effective_url": parts[2] if len(parts) > 2 else None,
        "command_code": r["code"],
        "error": sanitize(r["stderr"]),
    }

def db_readonly():
    result = {"attempted": False, "service": None, "connectivity": "UNKNOWN", "counts": {}}
    for service in ["mariadb", "mysql", "mysqld"]:
        if run(["systemctl","is-active",service], timeout=10)["stdout"] == "active":
            result["service"] = service
            break
    env_file = API / ".env"
    if not env_file.exists() or shutil.which("mysql") is None:
        return result
    values = {}
    for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" not in line or line.lstrip().startswith("#"):
            continue
        key, val = line.split("=", 1)
        if key in {"DB_USER","DB_PASSWORD","DB_NAME","DB_HOST","DB_PORT"}:
            values[key] = val.strip().strip("\"'")
    if not values.get("DB_USER"):
        return result
    cmd = ["mysql","-N","-B","-u",values["DB_USER"]]
    if values.get("DB_HOST"): cmd += ["-h",values["DB_HOST"]]
    if values.get("DB_PORT"): cmd += ["-P",values["DB_PORT"]]
    dbname = values.get("DB_NAME") or "fund_opcvm"
    cmd.append(dbname)
    cmd += ["-e","SELECT 'fonds',COUNT(*) FROM fond_investissements; SELECT 'valorisations',COUNT(*) FROM valorisations; SELECT 'last_vl',COALESCE(MAX(date),'NULL') FROM valorisations;"]
    env = os.environ.copy()
    if values.get("DB_PASSWORD"): env["MYSQL_PWD"] = values["DB_PASSWORD"]
    result["attempted"] = True
    r = run(cmd, env=env, timeout=25)
    result["connectivity"] = "PASS" if r["code"] == 0 else "FAIL"
    if r["code"] == 0:
        for line in r["stdout"].splitlines():
            parts = line.split("\t", 1)
            if len(parts) == 2: result["counts"][parts[0]] = parts[1]
    else:
        result["error"] = sanitize(r["stderr"])
    return result

def db_auth_diagnostic():
    denied = []
    r = run(["journalctl","-u","mariadb","--since","2026-09-12 00:00:00","--no-pager","-o","short-iso"], timeout=30)
    pattern = re.compile(r"Access denied for user 'fund_opcvm'@'localhost'")
    if r["code"] == 0:
        for line in r["stdout"].splitlines():
            if pattern.search(line):
                denied.append(line[:260])

    cron_lines = []
    cron_env_keys = []
    root_cron = run(["crontab","-l"], timeout=10)
    if root_cron["code"] == 0:
        for line in root_cron["stdout"].splitlines():
            t = line.strip()
            if not t or t.startswith("#"):
                continue
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", t):
                key = t.split("=",1)[0]
                cron_env_keys.append(key)
                continue
            low = t.lower()
            if "africafunds" in low or "fundafrica" in low or "scripts/" in low:
                cron_lines.append(sanitize(t)[:700])

    cron_users = []
    spool = Path("/var/spool/cron/crontabs")
    if spool.exists():
        for p in sorted(spool.iterdir()):
            if not p.is_file():
                continue
            user_rows = []
            env_keys = []
            try:
                txt = p.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for line in txt.splitlines():
                t = line.strip()
                if not t or t.startswith("#"):
                    continue
                if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", t):
                    env_keys.append(t.split("=",1)[0])
                    continue
                low = t.lower()
                if "africafunds" in low or "fundafrica" in low or "fund_opcvm" in low:
                    user_rows.append(sanitize(t)[:700])
            if user_rows or any(k.startswith("DB_") for k in env_keys):
                cron_users.append({"user":p.name,"env_keys":sorted(set(env_keys)),"project_lines":user_rows})

    global_env_keys = []
    for env_path in [Path("/etc/environment"), Path("/root/.profile"), Path("/root/.bashrc")]:
        if not env_path.exists():
            continue
        try:
            txt=env_path.read_text(encoding="utf-8",errors="ignore")
        except Exception:
            continue
        for line in txt.splitlines():
            t=line.strip().replace("export ","",1)
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=",t):
                key=t.split("=",1)[0]
                if key.startswith("DB_") or key in {"MYSQL_PWD","DATABASE_URL"}:
                    global_env_keys.append({"source":str(env_path),"key":key})

    timers = []
    timer_out = run(["systemctl","list-timers","--all","--no-pager","--no-legend"], timeout=15)
    if timer_out["code"] == 0:
        for line in timer_out["stdout"].splitlines():
            low=line.lower()
            if "africa" in low or "fund" in low:
                timers.append(line[:500])

    process_lines = []
    ps = run(["ps","-eo","pid=,lstart=,args="], timeout=10)
    if ps["code"] == 0:
        for line in ps["stdout"].splitlines():
            low = line.lower()
            if "africafunds.chainsolutions.fr/api" in low or "fund_opcvm" in low:
                process_lines.append(sanitize(line.strip())[:700])

    log_matches = []
    candidates = []
    for pattern_glob in [
        "/var/log/africafunds*.log",
        "/var/log/cron_*.log",
        "/root/.pm2/logs/*.log",
        str(API / "data" / "**" / "*.log"),
    ]:
        import glob
        candidates.extend(glob.glob(pattern_glob, recursive=True))
    seen=set()
    for raw_path in candidates:
        if raw_path in seen:
            continue
        seen.add(raw_path)
        p=Path(raw_path)
        try:
            if not p.is_file() or p.stat().st_size > 200_000_000:
                continue
            with p.open("rb") as fh:
                size=p.stat().st_size
                fh.seek(max(0,size-2_000_000))
                txt=fh.read().decode("utf-8",errors="ignore")
        except Exception:
            continue
        hits=[]
        for line in txt.splitlines():
            low=line.lower()
            if "access denied" in low or "er_access_denied_error" in low:
                hits.append(sanitize(line)[:700])
        if hits:
            log_matches.append({"path":str(p),"matches":hits[-8:]})

    return {
        "access_denied_count_since_midnight": len(denied),
        "access_denied_lines": denied[-50:],
        "root_cron_env_keys": sorted(set(cron_env_keys)),
        "root_project_cron_lines": cron_lines,
        "cron_users": cron_users,
        "global_db_env_keys": global_env_keys,
        "project_systemd_timers": timers,
        "project_processes": process_lines[:100],
        "log_correlations": log_matches[:100],
        "runtime_env": {
            "exists": (API / ".env").exists(),
            "tracked": run(["git","ls-files","--error-unmatch",".env"], API)["code"] == 0,
            "ignored": run(["git","check-ignore","--no-index",".env"], API)["code"] == 0,
        },
        "read_only": True,
        "secret_values_exposed": False,
    }

def runtime_snapshot():
    p = Path("/var/lib/fundafrica/runtime/PRODUCTION_STATE.json")
    out = {"path": str(p), "exists": p.exists()}
    if not p.exists(): return out
    st = p.stat()
    out.update({"size": st.st_size, "mtime_epoch": int(st.st_mtime)})
    try:
        payload = json.loads(p.read_text(encoding="utf-8"))
        out["generated_at"] = payload.get("generated_at")
    except Exception as exc:
        out["parse_error"] = str(exc)
    return out

def main():
    observation = {
        "schema_version": "1.0.0",
        "project_uid": "CS-AFRICAFUNDS-001",
        "observed_at_epoch": int(time.time()),
        "hostname": run(["hostname"])["stdout"],
        "kernel": run(["uname","-a"])["stdout"],
        "git": {
            "api": git_repo(API),
            "frontend": git_repo(FRONT),
        },
        "resources": {
            "uptime": run(["uptime"])["stdout"],
            "loadavg": Path("/proc/loadavg").read_text().strip() if Path("/proc/loadavg").exists() else None,
            "memory": run(["free","-m"])["stdout"],
            "disk": run(["df","-h","/","/var/www/vhosts"], timeout=10)["stdout"],
        },
        "runtime": {
            "pm2": None,
            "systemd": systemd_status(["mariadb","mysql","mysqld","nginx","docker"]),
            "docker_ps": sanitize(run(["docker","ps","--format","{{.Names}}|{{.Status}}|{{.Ports}}"], timeout=15)["stdout"]) if shutil.which("docker") else None,
            "processes_top_rss": sanitize(run(["ps","-eo","pid,comm,%cpu,%mem,rss","--sort=-rss"], timeout=10)["stdout"].split("\n", 21)[0:21]),
            "ports": sanitize(run(["ss","-ltnp"], timeout=10)["stdout"]) if shutil.which("ss") else None,
            "node_version": run(["node","--version"])["stdout"] if shutil.which("node") else None,
            "npm_version": run(["npm","--version"])["stdout"] if shutil.which("npm") else None,
        },
        "database": db_readonly(),
        "db_auth_diagnostic": db_auth_diagnostic(),
        "http": [
            http_probe("https://africafunds.chainsolutions.fr/"),
            http_probe("https://africafunds.chainsolutions.fr/home"),
            http_probe("https://africafunds.chainsolutions.fr/api/getactualite"),
            http_probe("http://localhost:3005/api/getactualite"),
        ],
        "cron": {
            "root_entry_count": len([x for x in run(["crontab","-l"], timeout=10)["stdout"].splitlines() if x.strip() and not x.lstrip().startswith("#")]),
            "cron_d_files": sorted([p.name for p in Path("/etc/cron.d").iterdir()]) if Path("/etc/cron.d").exists() else [],
        },
        "runtime_snapshot": runtime_snapshot(),
        "recent_errors": {
            "mariadb": sanitize(run(["journalctl","-u","mariadb","-n","20","--no-pager","-o","short-iso"], timeout=15)["stdout"]),
        },
        "safety": {
            "read_only_observer": True,
            "arbitrary_remote_shell": False,
            "secrets_printed": False,
            "git_fetch_performed": False,
            "production_mutation_performed": False,
        },
    }
    try:
        raw = run(["pm2","jlist"], timeout=15)
        if raw["code"] == 0:
            payload = raw["stdout"]
            start = payload.find("[")
            if start < 0:
                raise ValueError("PM2 JSON array not found")
            rows = json.loads(payload[start:])
            observation["runtime"]["pm2"] = [
                {
                    "name": row.get("name"),
                    "pid": row.get("pid"),
                    "status": (row.get("pm2_env") or {}).get("status"),
                    "restarts": (row.get("pm2_env") or {}).get("restart_time"),
                    "node_version": (row.get("pm2_env") or {}).get("node_version"),
                    "cwd": (row.get("pm2_env") or {}).get("pm_cwd"),
                }
                for row in rows
                if row.get("name") in {"api-monolith","fundafrique-frontend"}
            ]
    except Exception as exc:
        observation["runtime"]["pm2_error"] = str(exc)
    print(json.dumps(observation, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
