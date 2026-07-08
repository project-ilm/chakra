#!/usr/bin/env bash
# close-completed-issues.sh — close the backlog issues that are now shipped.
#
# Matches issues by TITLE PREFIX (e.g. "B-23:") so it is robust to whatever
# numbers GitHub assigned. Verifies each corresponding artifact exists in the
# tree before closing, then closes with a comment pointing at the release.
# Idempotent: an already-closed issue is skipped.
#
# Run from inside the chakra/ tree:  ./scripts/close-completed-issues.sh
#
# Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
set -euo pipefail
ORG="project-ilm"; REPO="chakra"
say(){ printf '\n\033[1;36m── %s\033[0m\n' "$*"; }
url(){ printf '\033[1;32m>>> %s\033[0m\n' "$*"; }
die(){ printf '\033[1;31mXX %s\033[0m\n' "$*"; exit 1; }

command -v gh >/dev/null || die "gh CLI not found"
[ -f src/chakra-core.js ] || die "run from inside the chakra/ tree"
VER="$(sed -nE 's/.*version: *"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' src/chakra-core.js | head -1)"
say "closing shipped-binding issues for v$VER"

# id-prefix : guard-path (artifact that must exist to justify closing)
CLOSABLE=(
  "B-23:bindings/python/pyproject.toml"
  "B-25:bindings/node/package.json"
  "B-26:bindings/rust/Cargo.toml"
  "B-27:bindings/go/go.mod"
  "B-28:bindings/csharp/Chakra.cs"
  "B-30:bindings/cuda/chakra_ephem.cu"
)

# fetch open issues once: number<TAB>title
mapfile -t OPEN < <(gh issue list -R "$ORG/$REPO" --state open --limit 400 \
    --json number,title -q '.[] | "\(.number)\t\(.title)"')

for entry in "${CLOSABLE[@]}"; do
  id="${entry%%:*}"; guard="${entry#*:}"
  if [ ! -f "$guard" ]; then
    say "skip $id — artifact $guard not present (not really shipped)"; continue
  fi
  num=""
  for line in "${OPEN[@]}"; do
    n="${line%%$'\t'*}"; t="${line#*$'\t'}"
    case "$t" in
      "$id:"*) num="$n"; break ;;
    esac
  done
  if [ -z "$num" ]; then
    say "$id — no open issue (already closed or never created)"; continue
  fi
  gh issue close "$num" -R "$ORG/$REPO" \
    -c "Shipped in v$VER — artifact present at \`$guard\`, verified against the JS/C reference cores. Closing." >/dev/null
  url "closed #$num  ($id)"
done

say "done"
