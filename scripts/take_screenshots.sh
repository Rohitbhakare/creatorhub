#!/usr/bin/env bash
# take_screenshots.sh — Capture simulator screenshots of every CreatorHub screen.
#
# Usage (from the repo root):
#   bash scripts/take_screenshots.sh [device_udid]
#
# Default device: iPhone 16 Pro (D42232F9-A0EB-432C-B44E-B41930E48E12)
#
# How it works:
#   1. Starts a TCP listener (nc) on port 9999 in a loop.
#   2. The patrol test sends the screen name via Socket.connect('127.0.0.1', 9999).
#      The iOS simulator shares the Mac's loopback — same mechanism Patrol uses
#      on ports 8081/8082 for its own test server communication.
#   3. When a name arrives, xcrun simctl io screenshot captures the simulator.
#   4. The name may contain a forward slash (e.g. "01_onboarding/01_welcome");
#      the script creates the subdirectory before writing the PNG.
#   5. Screenshots land in creatorhub/screenshots/<cluster>/<sequence>.png.
#
# Requirements:
#   - Xcode command-line tools (xcrun, nc)
#   - Patrol CLI installed (patrol)
#   - iOS Simulator booted

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────

DEVICE="${1:-D42232F9-A0EB-432C-B44E-B41930E48E12}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
SCREENSHOTS_DIR="$REPO_ROOT/screenshots"
PORT=9999

mkdir -p "$SCREENSHOTS_DIR"

# ── Validate simulator ────────────────────────────────────────────

if ! xcrun simctl list devices | grep -q "$DEVICE"; then
  echo "❌  Device $DEVICE not found. Check the UDID or pass one as the first arg."
  exit 1
fi

BOOT_STATE=$(xcrun simctl list devices | grep "$DEVICE" | grep -o '(Booted)\|(Shutdown)' | head -1)
if [ "$BOOT_STATE" != "(Booted)" ]; then
  echo "⚙️  Booting simulator $DEVICE ..."
  xcrun simctl boot "$DEVICE"
  sleep 5
fi

echo "✅  Simulator $DEVICE is booted."
echo "📂  Screenshots → $SCREENSHOTS_DIR"
echo "🔌  TCP listener on port $PORT (simulator signals host when each screen is ready)"
echo ""

# ── TCP listener — captures screenshot each time test sends a name ─

# Each time the patrol test signals a screenshot, it opens a TCP connection
# to port 9999 and sends the screen name followed by newline then closes.
# nc -l listens for one connection at a time and exits when it closes.
# This while loop restarts nc for the next screenshot.

CAPTURED=0

capture_loop() {
  while true; do
    # Wait for the next connection. nc exits when the connection closes.
    # The Dart test waits 800ms before connecting, giving nc time to restart.
    # Names may contain a forward slash (cluster/sequence) — allow it in head -c.
    NAME=$(nc -l "$PORT" 2>/dev/null | tr -d '\r\n' | head -c 120)
    if [ -n "$NAME" ]; then
      OUT="$SCREENSHOTS_DIR/${NAME}.png"
      # Create subdirectory (e.g. screenshots/01_onboarding/) if the name
      # contains a slash. No-op if the screenshot is flat.
      mkdir -p "$(dirname "$OUT")"
      sleep 0.4
      if xcrun simctl io "$DEVICE" screenshot "$OUT" 2>/dev/null; then
        CAPTURED=$((CAPTURED + 1))
        echo "  📸  [$CAPTURED] Saved: screenshots/${NAME}.png"
      else
        echo "  ⚠️   Failed to capture: $NAME"
      fi
    fi
  done
}

# Start the capture loop in the background.
capture_loop &
CAPTURE_PID=$!

# Make sure we kill the listener when the script exits.
cleanup() {
  kill "$CAPTURE_PID" 2>/dev/null || true
  # Kill any nc processes on port 9999 left behind.
  lsof -ti tcp:"$PORT" 2>/dev/null | xargs kill 2>/dev/null || true
  echo ""
  echo "══════════════════════════════════════════════"
  echo "  Done!"
  TOTAL=$(find "$SCREENSHOTS_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
  echo "  Screenshots saved: $TOTAL files → $SCREENSHOTS_DIR"
  if [ "$TOTAL" -gt 0 ]; then
    # Show relative path (cluster/file.png) for each capture.
    (cd "$SCREENSHOTS_DIR" && find . -name "*.png" | sed 's|^\./||' | sort)
  fi
  echo "══════════════════════════════════════════════"
}
trap cleanup EXIT

echo "▶️  Starting patrol test (xcodebuild — ~60 s build) ..."
echo ""

# ── Run the patrol test ───────────────────────────────────────────

cd "$MOBILE_DIR"
patrol test \
  --target integration_test/scenarios/screenshots_test.dart \
  --device "$DEVICE"
