#!/usr/bin/env bash
# Detach the tracked production .env from Git while preserving the exact runtime file.
# Usage: s2_detach_tracked_env.sh <expected_remote_sha>
set -euo pipefail

EXPECTED_REMOTE_SHA="${1:-}"
BRANCH="claude/code-review-improvements-ikvuj"
API="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
TS="$(date -u '+%Y%m%dT%H%M%SZ')"
BACKUP_ROOT="/var/backups/africafunds-secrets/$TS"

test "$EXPECTED_REMOTE_SHA" != "" || { echo "expected remote SHA required" >&2; exit 2; }
cd "$API"
test "$(git branch --show-current)" = "$BRANCH"
test -f .env
git ls-files --error-unmatch .env >/dev/null
test -z "$(git status --porcelain=v1 | grep -v '^?? ' || true)"

# The runtime file must still be identical to the tracked version before detach.
TMP_HEAD_ENV="$(mktemp)"
trap 'rm -f "$TMP_HEAD_ENV"' EXIT
git show HEAD:.env > "$TMP_HEAD_ENV"
cmp -s "$TMP_HEAD_ENV" .env || {
  echo "runtime .env differs from tracked HEAD; refusing detach" >&2
  exit 3
}

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"
install -m 600 .env "$BACKUP_ROOT/runtime.env.before-detach"
git rev-parse HEAD > "$BACKUP_ROOT/git-head-before.txt"
git status -sb > "$BACKUP_ROOT/git-status-before.txt"

# Record only key names, never values or hashes of secret values.
python3 - "$BACKUP_ROOT/runtime-env-keys.txt" <<'PY'
from pathlib import Path
import sys
keys=[]
for line in Path('.env').read_text(encoding='utf-8',errors='ignore').splitlines():
    t=line.strip()
    if not t or t.startswith('#') or '=' not in t:
        continue
    keys.append(t.split('=',1)[0].strip())
Path(sys.argv[1]).write_text('\n'.join(sorted(set(keys)))+'\n',encoding='utf-8')
PY
chmod 600 "$BACKUP_ROOT/runtime-env-keys.txt"

git fetch --prune origin "$BRANCH"
REMOTE="$(git rev-parse "origin/$BRANCH")"
REMOTE_LS="$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')"
test "$REMOTE" = "$REMOTE_LS"
test "$REMOTE" = "$EXPECTED_REMOTE_SHA" || {
  echo "remote HEAD drift: expected=$EXPECTED_REMOTE_SHA actual=$REMOTE" >&2
  exit 4
}
git merge-base --is-ancestor HEAD "$REMOTE" || {
  echo "target is not a fast-forward descendant" >&2
  exit 5
}

git merge --ff-only "origin/$BRANCH"

# The target Git tree must no longer track .env.
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo ".env is still tracked in target Git tree" >&2
  exit 6
fi

# Restore exact bytes as local runtime-only secret material.
install -m 600 "$BACKUP_ROOT/runtime.env.before-detach" .env
cmp -s "$BACKUP_ROOT/runtime.env.before-detach" .env || {
  echo "restored runtime .env differs from backup" >&2
  exit 7
}
git check-ignore --no-index .env >/dev/null || {
  echo ".env is not ignored after detach" >&2
  exit 8
}
test -z "$(git status --porcelain=v1 | grep -v '^?? ' || true)"

# Validate dotenv consumers without displaying any values.
node - <<'NODE'
require('dotenv').config({path:'.env'});
const required=['DB_NAME','DB_USER','DB_PASSWORD','DB_HOST','JWT_SECRET','EMAIL_PASSWORD','MAGIC_SECRET_KEY'];
const missing=required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('missing runtime keys:', missing.join(','));
  process.exit(20);
}
console.log('DOTENV_RUNTIME_KEYS=PASS');
NODE

# Validate DB credential end-to-end read-only.
node - <<'NODE'
require('dotenv').config({path:'.env'});
const mysql=require('mysql2/promise');
(async()=>{
  let c;
  try {
    c=await mysql.createConnection({
      host:process.env.DB_HOST || '127.0.0.1',
      user:process.env.DB_USER,
      password:process.env.DB_PASSWORD,
      database:process.env.DB_NAME,
      connectTimeout:10000,
    });
    const [rows]=await c.query('SELECT 1 AS ok');
    if (!rows || !rows[0] || rows[0].ok !== 1) throw new Error('SELECT 1 failed');
    console.log('DB_RUNTIME_CREDENTIAL=PASS');
  } finally {
    if (c) await c.end();
  }
})().catch(e=>{ console.error('DB_RUNTIME_CREDENTIAL=FAIL'); process.exit(21); });
NODE

CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3005/api/getactualite || true)"
echo "LOCAL_API_HTTP=$CODE"
case "$CODE" in 2*) ;; *) echo "local API check failed after detach" >&2; exit 22;; esac

echo "ENV_DETACH=PASS"
echo "runtime_env_path=$API/.env"
echo "runtime_env_mode=$(stat -c '%a' .env)"
echo "git_head=$(git rev-parse HEAD)"
echo "backup_path=$BACKUP_ROOT"
