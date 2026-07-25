#!/usr/bin/env bash
# Install / uninstall the twice-daily local ASDMA refresh LaunchAgent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.floodassist.asdma-refresh"
PLIST="${HOME}/Library/LaunchAgents/${LABEL}.plist"
SCRIPT="${REPO_ROOT}/scripts/local_refresh_asdma.sh"
CACHE_DIR="${HOME}/Library/Caches/FloodAssistAssam"
LOG_DIR="${CACHE_DIR}/logs"

usage() {
  echo "Usage: $0 [install|uninstall|status|run-now]"
  exit 1
}

cmd="${1:-install}"

case "$cmd" in
  uninstall)
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
    rm -f "$PLIST"
    echo "✓ Removed LaunchAgent ${LABEL}"
    exit 0
    ;;
  status)
    echo "Plist: $PLIST"
    if [[ -f "$PLIST" ]]; then
      echo "---"
      launchctl print "gui/$(id -u)/${LABEL}" 2>&1 | head -40 || echo "(not loaded)"
    else
      echo "(not installed)"
    fi
    exit 0
    ;;
  run-now)
    exec "$SCRIPT"
    ;;
  install) ;;
  *) usage ;;
esac

chmod +x "$SCRIPT"
mkdir -p "${HOME}/Library/LaunchAgents" "$LOG_DIR"

# 09:00 and 16:00 local time (IST on this Mac)
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${SCRIPT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REPO_ROOT}</string>
  <key>StartCalendarInterval</key>
  <array>
    <dict>
      <key>Hour</key>
      <integer>9</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
    <dict>
      <key>Hour</key>
      <integer>16</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HOME</key>
    <string>${HOME}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/launchd.err.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/${LABEL}"

echo "✓ Installed ${LABEL}"
echo "  Schedule: 09:00 and 16:00 local time"
echo "  Script:   ${SCRIPT}"
echo "  Logs:     ${LOG_DIR}/"
echo
echo "Commands:"
echo "  $0 status      # check agent"
echo "  $0 run-now     # scrape + PR immediately"
echo "  $0 uninstall   # remove schedule"
