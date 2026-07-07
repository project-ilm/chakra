#!/usr/bin/env bash
# mint-doi.sh — archive a CHAKRA release and mint a Zenodo DOI via misty-doi.
#
# SAFE BY DEFAULT. With no flags this runs a Zenodo *sandbox* *dry-run*: it builds
# the artifact and validates metadata but publishes nothing. A real, permanent DOI
# requires the explicit --live flag (CHAKRA has a history of accidental DOI
# fabrication; that must never recur).
#
# Real misty-doi interface (verified):
#   misty publish -m misty.json -f <artifact.tar.gz> [--sandbox] [--dry-run] [--no-publish]
#   token via ZENODO_TOKEN env (never a CLI flag); ORCID env applied to creators.
#   exit: 0 ok · 2 metadata · 3 creds · 4 zenodo
# Install:  pipx install misty-doi
#
# Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
say(){ printf '\n\033[1;36m── %s\033[0m\n' "$*"; }
die(){ printf '\n\033[1;31mXX %s\033[0m\n' "$*"; exit 1; }

LIVE=0
for a in "$@"; do [ "$a" = "--live" ] && LIVE=1; done

say "Pre-flight"
command -v misty >/dev/null || die "misty not found. Install:  pipx install misty-doi"
[ -f misty.json ] || die "misty.json missing at repo root"

# version must match the engine so the DOI can't describe the wrong build
CORE_VER="$(sed -nE 's/.*version: *"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' src/chakra-core.js | head -1)"
META_VER="$(sed -nE 's/.*"version" *: *"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p' misty.json | head -1)"
[ -n "$CORE_VER" ] || die "could not read version from src/chakra-core.js"
[ "$CORE_VER" = "$META_VER" ] || die "version mismatch: core=$CORE_VER misty.json=$META_VER — align them first"
say "version $CORE_VER (core == misty.json)"

if [ "$LIVE" = 1 ] && [ -z "${ZENODO_TOKEN:-}" ]; then
  die "--live requested but ZENODO_TOKEN is not set. export ZENODO_TOKEN=…  (production token)"
fi

say "Building artifact via git archive"
mkdir -p dist
ART="dist/chakra-v${CORE_VER}.tar.gz"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git archive --format=tar.gz --prefix="chakra-${CORE_VER}/" -o "$ART" HEAD
else
  die "not a git repo — mint from a clean checkout so the archive matches a commit"
fi
say "artifact: $ART ($(du -h "$ART" | cut -f1))"

if [ "$LIVE" = 1 ]; then
  say "LIVE mint → Zenodo PRODUCTION. This creates a permanent public DOI."
  printf '   type EXACTLY "mint %s" to proceed: ' "$CORE_VER"
  read -r reply
  [ "$reply" = "mint $CORE_VER" ] || die "confirmation mismatch — aborting (nothing published)"
  say "publishing (production)…"
  misty publish -m misty.json -f "$ART" --output "dist/doi-result.json"
  say "DONE — DOI details in dist/doi-result.json"
else
  say "SANDBOX DRY-RUN (default). Nothing will be published."
  say "  to actually mint later:  ZENODO_TOKEN=… $0 --live"
  misty publish -m misty.json -f "$ART" --sandbox --dry-run --output "dist/doi-dryrun.json" \
    || die "misty dry-run failed (see exit code above: 2=metadata 3=creds 4=zenodo)"
  say "dry-run OK — validated metadata + artifact; result in dist/doi-dryrun.json"
fi
