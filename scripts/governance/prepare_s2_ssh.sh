#!/usr/bin/env bash
# Prepare strict S2 SSH client material for AfricaFunds GitHub Actions.
# Inputs: S2_HOST, S2_SSH_KEY; optional S2_KNOWN_HOSTS.
# Fallback pin: .governance/ssh/s2_known_hosts.tofu (public host key).
set -euo pipefail

ROOT="${AFRICAFUNDS_REPO_ROOT:-$(pwd)}"
HOST="${S2_HOST:-}"
KEY="${S2_SSH_KEY:-}"
SECRET_PIN="${S2_KNOWN_HOSTS:-}"
REPO_PIN="$ROOT/.governance/ssh/s2_known_hosts.tofu"
TRUST_FILE="$ROOT/.governance/ssh/s2_hostkey_trust.json"

test -n "$HOST" || { echo "::error::S2_HOST missing"; exit 10; }
test -n "$KEY" || { echo "::error::S2_SSH_KEY missing"; exit 11; }

mkdir -p ~/.ssh
chmod 700 ~/.ssh
printf '%s\n' "$KEY" > ~/.ssh/id_deploy
chmod 600 ~/.ssh/id_deploy

if [ -n "$SECRET_PIN" ]; then
  printf '%s\n' "$SECRET_PIN" > ~/.ssh/known_hosts
  TRUST_SOURCE="SECRET_PIN"
elif [ -s "$REPO_PIN" ]; then
  cp "$REPO_PIN" ~/.ssh/known_hosts
  TRUST_SOURCE="TOFU_PINNED_PENDING_OOB"
else
  echo "::error::No S2 host-key pin available (secret or repository TOFU pin)."
  exit 12
fi
chmod 600 ~/.ssh/known_hosts

if ! ssh-keygen -F "$HOST" -f ~/.ssh/known_hosts >/dev/null 2>&1; then
  echo "::error::Pinned known_hosts does not contain S2_HOST."
  exit 13
fi

if [ "$TRUST_SOURCE" = "TOFU_PINNED_PENDING_OOB" ]; then
  test -s "$TRUST_FILE" || { echo "::error::TOFU trust metadata missing"; exit 14; }
  python3 - "$TRUST_FILE" <<'PY'
import json,sys
p=json.load(open(sys.argv[1],encoding='utf-8'))
assert p["trust_model"]=="TOFU_PINNED_PENDING_OOB"
assert p["strict_host_key_checking_required"] is True
assert p["automatic_key_rotation"] is False
PY
fi

echo "S2_SSH_TRUST_SOURCE=$TRUST_SOURCE"
echo "S2_STRICT_HOST_KEY_CHECKING=YES"
echo "S2_ARBITRARY_HOSTKEY_REFRESH=FORBIDDEN"
