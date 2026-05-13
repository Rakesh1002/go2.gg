#!/usr/bin/env bash
# Print a fresh agent_run_id. Prefers uuidgen; falls back to /dev/urandom.

set -euo pipefail

if command -v uuidgen >/dev/null 2>&1; then
  uuidgen | tr "[:upper:]" "[:lower:]"
else
  od -x /dev/urandom | head -1 | awk '{print $2$3"-"$4"-"$5"-"$6"-"$7$8$9}'
fi
