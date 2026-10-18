#!/usr/bin/env bash
# AfricaFunds S2 Git guard — shared GOV-006 primitive.
# Usage: s2_git_guard.sh observe|reconcile api|frontend|both
# No reset --hard, no clean, no force-push, no deletion of untracked artifacts.
set -euo pipefail

MODE="${1:-observe}"
TARGET="${2:-both}"
BRANCH="claude/code-review-improvements-ikvuj"
API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
FRONT_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend"
TS="$(date -u '+%Y%m%dT%H%M%SZ')"
BACKUP_ROOT="/var/backups/fundafrica-governance/$TS"

case "$MODE" in observe|reconcile) ;; *) echo "invalid mode: $MODE" >&2; exit 2;; esac
case "$TARGET" in api|frontend|both) ;; *) echo "invalid target: $TARGET" >&2; exit 2;; esac

classify_untracked() {
  local dir="$1"
  cd "$dir"
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    case "$path" in
      .mcp_logs/*) klass="LOG" ;;
      sec_ng_downloads/*) klass="DOWNLOAD" ;;
      data/datejour_snapshots/*|data/naira_snapshots/*|data/scale_break_snapshots/*) klass="BUSINESS_DATA" ;;
      0) klass="UNKNOWN" ;;
      *) klass="UNKNOWN" ;;
    esac
    printf 'untracked_class=%s|%s\n' "$klass" "$path"
  done < <(git status --porcelain=v1 | sed -n 's/^?? //p')
}

observe_repo() {
  local name="$1" dir="$2"
  cd "$dir"
  test -d .git
  local branch head remote tracked
  branch="$(git branch --show-current)"
  head="$(git rev-parse HEAD)"
  remote="$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')"
  tracked="$(git status --porcelain=v1 | grep -v '^?? ' || true)"
  echo "repo=$name"
  echo "path=$dir"
  echo "branch=$branch"
  echo "expected_branch=$BRANCH"
  echo "head=$head"
  echo "remote_head=${remote:-MISSING}"
  if [ "$branch" = "$BRANCH" ]; then echo "branch_match=YES"; else echo "branch_match=NO"; fi
  if [ -n "$remote" ] && [ "$head" = "$remote" ]; then echo "remote_alignment=EXACT"; else echo "remote_alignment=MISMATCH"; fi
  if [ -n "$tracked" ]; then
    echo "tracked_dirty=YES"
    printf '%s\n' "$tracked"
  else
    echo "tracked_dirty=NO"
  fi
  classify_untracked "$dir"
}

reconcile_api() {
  local dir="$API_DIR"
  cd "$dir"
  test "$(git branch --show-current)" = "$BRANCH"
  local start tracked remote remote_ls snapshot_only other c files count
  start="$(git rev-parse HEAD)"
  tracked="$(git status --porcelain=v1 | grep -v '^?? ' || true)"
  if [ -n "$tracked" ]; then
    echo "API tracked changes present; refusing reconciliation." >&2
    printf '%s\n' "$tracked" >&2
    exit 20
  fi

  mkdir -p "$BACKUP_ROOT/api"
  chmod 700 "$BACKUP_ROOT"
  git status -sb > "$BACKUP_ROOT/api/status-before.txt"
  git log --format='%H | %cI | %s' -n 100 > "$BACKUP_ROOT/api/log-before.txt"
  cp -a PRODUCTION_STATE.json "$BACKUP_ROOT/api/PRODUCTION_STATE.before.json" 2>/dev/null || true

  git fetch --prune origin "$BRANCH"
  remote="$(git rev-parse "origin/$BRANCH")"
  remote_ls="$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')"
  test "$remote" = "$remote_ls"

  snapshot_only=0
  other=0
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    files="$(git diff-tree --no-commit-id --name-only -r "$c" | sed '/^$/d')"
    count="$(printf '%s\n' "$files" | sed '/^$/d' | wc -l | tr -d ' ')"
    if [ "$count" = "1" ] && [ "$files" = "PRODUCTION_STATE.json" ]; then
      snapshot_only=$((snapshot_only + 1))
    else
      other=$((other + 1))
      echo "unsafe_local_commit=$c files=$(printf '%s' "$files" | tr '\n' ',')" >&2
    fi
  done < <(git rev-list "origin/$BRANCH..HEAD")

  echo "api_snapshot_only_local_commits=$snapshot_only"
  echo "api_other_local_commits=$other"
  [ "$other" -eq 0 ] || { echo "Refusing API reconciliation: non-snapshot local commits exist." >&2; exit 21; }

  if [ "$snapshot_only" -gt 0 ]; then
    git bundle create "$BACKUP_ROOT/api/local-branch-before.bundle" "$BRANCH"
    git bundle verify "$BACKUP_ROOT/api/local-branch-before.bundle"
    printf '%s\n' "$start" > "$BACKUP_ROOT/api/local-head-before.txt"
    printf '%s\n' "$remote" > "$BACKUP_ROOT/api/remote-head-target.txt"
    test "$(git rev-parse HEAD)" = "$start"
    test "$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')" = "$remote"
    git switch --detach "$remote"
    git branch -f "$BRANCH" "$remote"
    git switch "$BRANCH"
  elif [ "$start" != "$remote" ]; then
    if git merge-base --is-ancestor "$start" "$remote"; then
      git merge --ff-only "origin/$BRANCH"
    else
      echo "API divergence is not a safe fast-forward." >&2
      exit 22
    fi
  fi

  test "$(git rev-parse HEAD)" = "$remote"
  tracked="$(git status --porcelain=v1 | grep -v '^?? ' || true)"
  [ -z "$tracked" ] || { echo "API tracked dirty after reconciliation." >&2; exit 23; }
  echo "api_reconciled_head=$remote"
  classify_untracked "$dir"
}

reconcile_frontend() {
  local dir="$FRONT_DIR"
  cd "$dir"
  test "$(git branch --show-current)" = "$BRANCH"
  local start dirty_paths remote remote_ls local_lock remote_lock tracked
  start="$(git rev-parse HEAD)"
  dirty_paths="$(git status --porcelain=v1 | grep -v '^?? ' | awk '{print $2}' | sort -u || true)"
  if [ -n "$dirty_paths" ] && [ "$dirty_paths" != "package-lock.json" ]; then
    echo "Frontend tracked changes present; refusing reconciliation." >&2
    printf '%s\n' "$dirty_paths" >&2
    exit 30
  fi

  mkdir -p "$BACKUP_ROOT/frontend"
  chmod 700 "$BACKUP_ROOT"
  git status -sb > "$BACKUP_ROOT/frontend/status-before.txt"
  git log --format='%H | %cI | %s' -n 100 > "$BACKUP_ROOT/frontend/log-before.txt"
  cp -a package-lock.json "$BACKUP_ROOT/frontend/package-lock.before.json" 2>/dev/null || true

  git fetch --prune origin "$BRANCH"
  remote="$(git rev-parse "origin/$BRANCH")"
  remote_ls="$(git ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')"
  test "$remote" = "$remote_ls"
  test "$(git rev-list --count "origin/$BRANCH..HEAD")" = "0"

  if git status --porcelain=v1 | grep -q '^ M package-lock.json$'; then
    local_lock="$(git hash-object package-lock.json)"
    remote_lock="$(git rev-parse "origin/$BRANCH:package-lock.json")"
    echo "frontend_local_lock_hash=$local_lock"
    echo "frontend_remote_lock_hash=$remote_lock"
    [ "$local_lock" = "$remote_lock" ] || { echo "Frontend package-lock contains unpreserved work." >&2; exit 31; }
    git restore --source="origin/$BRANCH" -- package-lock.json
  fi

  if [ "$start" != "$remote" ]; then
    git merge --ff-only "origin/$BRANCH"
  fi
  test "$(git rev-parse HEAD)" = "$remote"
  tracked="$(git status --porcelain=v1 | grep -v '^?? ' || true)"
  [ -z "$tracked" ] || { echo "Frontend tracked dirty after reconciliation." >&2; exit 32; }
  echo "frontend_reconciled_head=$remote"
  classify_untracked "$dir"
}

if [ "$MODE" = "observe" ]; then
  case "$TARGET" in
    api) observe_repo API "$API_DIR" ;;
    frontend) observe_repo FRONTEND "$FRONT_DIR" ;;
    both) observe_repo API "$API_DIR"; observe_repo FRONTEND "$FRONT_DIR" ;;
  esac
  exit 0
fi

case "$TARGET" in
  api) reconcile_api ;;
  frontend) reconcile_frontend ;;
  both) reconcile_api; reconcile_frontend ;;
esac

echo "reconciliation_backup=$BACKUP_ROOT"
