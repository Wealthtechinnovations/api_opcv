#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
REMOTE_COMMAND="${2:-}"
STDIN_FILE="${3:-/dev/null}"

test -n "$TARGET" || { echo "::error::SSH target missing" >&2; exit 64; }
test -n "$REMOTE_COMMAND" || { echo "::error::Remote command missing" >&2; exit 64; }
test "${AFRICAFUNDS_SSH_OPERATION_CLASS:-}" = "READ_ONLY" || {
  echo "::error::s2_ssh_readonly_retry.sh is restricted to READ_ONLY operations" >&2
  exit 64
}
test -r "$STDIN_FILE" || { echo "::error::stdin file not readable: $STDIN_FILE" >&2; exit 66; }

SSH_BIN="${SSH_BIN:-ssh}"
MAX_ATTEMPTS="${S2_SSH_READONLY_ATTEMPTS:-4}"
BACKOFF="${S2_SSH_READONLY_BACKOFF_SECONDS:-3}"

case "$MAX_ATTEMPTS" in (*[!0-9]*|'') echo "::error::invalid attempt count" >&2; exit 64;; esac
case "$BACKOFF" in (*[!0-9]*|'') echo "::error::invalid backoff" >&2; exit 64;; esac
[ "$MAX_ATTEMPTS" -ge 1 ] || { echo "::error::attempt count must be >=1" >&2; exit 64; }

TRANSIENT_RE='kex_exchange_identification|banner exchange|Connection reset by peer|Connection timed out|Connection closed by remote host|Connection closed by .* port 22'
FATAL_RE='Permission denied|Host key verification failed|REMOTE HOST IDENTIFICATION HAS CHANGED|WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED'

last_rc=255
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  out="$(mktemp)"
  err="$(mktemp)"
  set +e
  "$SSH_BIN" -i ~/.ssh/id_deploy -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 -o ServerAliveInterval=10 -o ServerAliveCountMax=1 "$TARGET" "$REMOTE_COMMAND" < "$STDIN_FILE" > "$out" 2> "$err"
  rc=$?
  set -e
  last_rc=$rc

  cat "$out"
  cat "$err" >&2

  if [ "$rc" -eq 0 ]; then
    rm -f "$out" "$err"
    exit 0
  fi
  if grep -Eqi "$FATAL_RE" "$err"; then
    echo "::error::SSH fatal trust/authentication failure; no retry" >&2
    rm -f "$out" "$err"
    exit "$rc"
  fi
  if [ -s "$out" ]; then
    echo "::error::SSH failed after remote output; execution ambiguous, no retry" >&2
    rm -f "$out" "$err"
    exit "$rc"
  fi
  if ! grep -Eqi "$TRANSIENT_RE" "$err"; then
    echo "::error::SSH failure is not an approved transient pre-auth signature; no retry" >&2
    rm -f "$out" "$err"
    exit "$rc"
  fi
  rm -f "$out" "$err"
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    delay=$((BACKOFF * attempt))
    echo "S2_READONLY_SSH_TRANSIENT_RETRY attempt=$attempt next_delay_seconds=$delay" >&2
    sleep "$delay"
  fi
done
echo "::error::S2 read-only SSH exhausted $MAX_ATTEMPTS attempts" >&2
exit "$last_rc"
