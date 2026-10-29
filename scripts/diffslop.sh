#!/usr/bin/env bash
# The GitHub Action entry point for diffslop.
#
# All logic lives here, not in action.yml. An action that inlines shell in YAML
# cannot be tested, reviewed, or run locally.
set -euo pipefail

since="${INPUT_SINCE:-origin/main}"
max_index="${INPUT_MAX_INDEX:-0}"
fail_on_slop="${INPUT_FAIL_ON_SLOP:-true}"
all="${INPUT_ALL:-false}"
staged="${INPUT_STAGED:-false}"

args=(--since "$since" --max-index "$max_index")

if [ "$fail_on_slop" = "true" ]; then
  args+=(--fail-on-slop)
fi

if [ "$all" = "true" ]; then
  args+=(--all)
fi

if [ "$staged" = "true" ]; then
  args+=(--staged)
fi

echo "diffslop --since $since --max-index $max_index"
node "$(dirname "$0")/../bin/diffslop.js" "${args[@]}"
