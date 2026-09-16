#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HELPER="$ROOT/scripts/governance/s2_ssh_readonly_retry.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
COUNT="$TMP/count"
INPUT="$TMP/input"
FAKE="$TMP/fake-ssh"
echo "payload" > "$INPUT"

cat > "$FAKE" <<'FAKE'
#!/usr/bin/env bash
set -euo pipefail
n=0
[ ! -f "${TEST_COUNT_FILE:?}" ] || n="$(cat "$TEST_COUNT_FILE")"
n=$((n+1))
echo "$n" > "$TEST_COUNT_FILE"
cat >/dev/null || true
case "${TEST_MODE:?}" in
  transient_then_success)
    if [ "$n" -eq 1 ]; then
      echo "kex_exchange_identification: read: Connection reset by peer" >&2
      exit 255
    fi
    echo "OK"
    ;;
  auth_failure)
    echo "Permission denied (publickey)." >&2
    exit 255
    ;;
  ambiguous_output)
    echo "PARTIAL"
    echo "Connection reset by peer" >&2
    exit 255
    ;;
  *)
    exit 2
    ;;
esac
FAKE
chmod +x "$FAKE"

export AFRICAFUNDS_SSH_OPERATION_CLASS=READ_ONLY
export SSH_BIN="$FAKE"
export S2_SSH_READONLY_BACKOFF_SECONDS=0
export S2_SSH_READONLY_ATTEMPTS=4
export TEST_COUNT_FILE="$COUNT"

: > "$COUNT"
export TEST_MODE=transient_then_success
out="$("$HELPER" root@example "python3 -" "$INPUT")"
test "$out" = "OK"
test "$(cat "$COUNT")" = "2"

: > "$COUNT"
export TEST_MODE=auth_failure
if "$HELPER" root@example "python3 -" "$INPUT" >/dev/null 2>&1; then exit 1; fi
test "$(cat "$COUNT")" = "1"

: > "$COUNT"
export TEST_MODE=ambiguous_output
if "$HELPER" root@example "python3 -" "$INPUT" >/dev/null 2>&1; then exit 1; fi
test "$(cat "$COUNT")" = "1"

unset AFRICAFUNDS_SSH_OPERATION_CLASS
if "$HELPER" root@example "python3 -" "$INPUT" >/dev/null 2>&1; then exit 1; fi

echo "S2_READONLY_SSH_RETRY_TEST=PASS"
