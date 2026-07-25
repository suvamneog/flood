#!/usr/bin/env bash
# Local ASDMA refresh — run by launchd (or manually).
# Scrapes from this Mac (Indian IP), then opens/updates a PR.
# Never pushes directly to main.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${HOME}/Library/Caches/FloodAssistAssam"
WORK_DIR="${CACHE_DIR}/work"
LOG_DIR="${CACHE_DIR}/logs"
BRANCH="data/asdma-refresh"
LOOKBACK="${LOOKBACK:-5}"
PYTHON="${PYTHON:-/usr/bin/python3}"

mkdir -p "$LOG_DIR" "$CACHE_DIR"
LOG_FILE="${LOG_DIR}/refresh-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== FloodAssist ASDMA local refresh $(date) ==="
echo "Repo: $REPO_ROOT"
echo "Work: $WORK_DIR"

github_token() {
  printf 'protocol=https\nhost=github.com\n' | git credential fill 2>/dev/null \
    | awk -F= '/^password=/{print $2; exit}'
}

ensure_worktree() {
  if [[ -d "$WORK_DIR/.git" || -f "$WORK_DIR/.git" ]]; then
    return 0
  fi
  echo "→ Creating dedicated worktree at $WORK_DIR"
  git -C "$REPO_ROOT" fetch origin main
  rm -rf "$WORK_DIR"
  git -C "$REPO_ROOT" worktree add -B "$BRANCH" "$WORK_DIR" origin/main
}

ensure_worktree
cd "$WORK_DIR"

echo "→ Syncing worktree to origin/main"
git fetch origin main
git checkout -B "$BRANCH" origin/main
git reset --hard origin/main
git clean -fd -- src/data scripts/raw

echo "→ Running scraper (lookback=$LOOKBACK)"
"$PYTHON" scripts/scrape_asdma_pdf.py --lookback "$LOOKBACK"

if git diff --quiet -- src/data \
  && [[ -z "$(git ls-files --others --exclude-standard -- src/data)" ]]; then
  echo "✓ No data changes — latest report already reflected."
  exit 0
fi

REPORT_DATE="$(
  "$PYTHON" - <<'PY'
import json
from pathlib import Path
print(json.loads(Path("src/data/stats.json").read_text()).get("reportDate", "unknown"))
PY
)"

echo "→ Data changed (report $REPORT_DATE). Committing…"
git add src/data
git commit -m "chore: refresh ASDMA flood data (${REPORT_DATE})"

echo "→ Pushing branch $BRANCH"
git push -u origin "HEAD:$BRANCH" --force-with-lease

TOKEN="$(github_token || true)"
if [[ -z "${TOKEN:-}" ]]; then
  echo "⚠ No GitHub credentials — branch pushed, but PR was not opened."
  echo "  Open manually: https://github.com/suvamneog/flood/compare/main...${BRANCH}"
  exit 0
fi

EXISTING="$(
  curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/suvamneog/flood/pulls?head=suvamneog:${BRANCH}&state=open" \
  | "$PYTHON" -c "import json,sys; d=json.load(sys.stdin); print(d[0]['html_url'] if isinstance(d,list) and d else '')"
)"

if [[ -n "$EXISTING" ]]; then
  echo "✓ Updated existing PR: $EXISTING"
  exit 0
fi

export REPORT_DATE BRANCH TOKEN
"$PYTHON" - <<'PY'
import json, os, urllib.request

report = os.environ["REPORT_DATE"]
branch = os.environ["BRANCH"]
token = os.environ["TOKEN"]
body = (
    "Automated ASDMA Daily Flood Report refresh (local Mac scheduler).\n\n"
    f"- Report date: **{report}**\n"
    "- Source: https://sdrf.assam.gov.in/dfr/\n"
    "- Only `src/data/*.json` is touched.\n"
    "- Review the diff before merging.\n"
)
payload = json.dumps({
    "title": f"Data: refresh ASDMA flood report ({report})",
    "head": branch,
    "base": "main",
    "body": body,
}).encode()
req = urllib.request.Request(
    "https://api.github.com/repos/suvamneog/flood/pulls",
    data=payload,
    method="POST",
    headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "FloodAssistAssam-local-refresh",
    },
)
with urllib.request.urlopen(req) as resp:
    data = json.load(resp)
print("✓ Opened PR:", data.get("html_url", data))
PY
