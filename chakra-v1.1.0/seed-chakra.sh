#!/usr/bin/env bash
# seed-chakra.sh — one-shot publisher for CHAKRA → github.com/project-ilm/chakra
# Idempotent: safe to re-run. Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
set -euo pipefail
ORG="project-ilm"; REPO="chakra"
say(){ printf '\n\033[1;36m── %s\033[0m\n' "$*"; }
url(){ printf '\033[1;33m>>> %s\033[0m\n' "$*"; }
die(){ printf '\033[1;31mXX %s\033[0m\n' "$*"; exit 1; }

say "Pre-flight"
command -v gh  >/dev/null || die "GitHub CLI (gh) is required: https://cli.github.com"
command -v git >/dev/null || die "git is required"
gh auth status >/dev/null 2>&1 || die "not authenticated — run: gh auth login"
gh api "orgs/$ORG" -q .login >/dev/null 2>&1 || die "cannot reach org '$ORG' with this token"
gh auth setup-git >/dev/null 2>&1 || true
say "auth OK · org '$ORG' reachable"

say "Repository"
if gh repo view "$ORG/$REPO" >/dev/null 2>&1; then
  say "repo exists — will push into it"
else
  gh repo create "$ORG/$REPO" --public \
    --description "CHAKRA — Temporal Cycle Observatory: offline multi-tradition astronomical/calendrical observatory, tested library, and URL→JSON API. GPL-3.0." \
    >/dev/null
  say "repo created"
fi
url "https://github.com/$ORG/$REPO"

say "Commit & push"
cd "$(cd "$(dirname "$0")" && pwd)"
[ -d .git ] || git init -b main >/dev/null
git add -A
if git -c user.name="Abhishek Choudhary" -c user.email="obonac@users.noreply.github.com" \
   commit -m "CHAKRA v1.1.0 — library split (4 layers), 5 new calendars, jyotisha engines, URL API, computed festival engine, 74-assertion test suite" >/dev/null; then
  say "committed"
else
  say "nothing new to commit"
fi
git remote get-url origin >/dev/null 2>&1 && git remote set-url origin "https://github.com/$ORG/$REPO.git" \
                                          || git remote add origin "https://github.com/$ORG/$REPO.git"
git push -u origin main
url "https://github.com/$ORG/$REPO  (pushed: main)"

say "Topics"
gh repo edit "$ORG/$REPO" \
  --add-topic astronomy --add-topic panchang --add-topic calendar --add-topic jyotisha \
  --add-topic hijri --add-topic hebrew-calendar --add-topic nanakshahi --add-topic ephemeris \
  --add-topic offline-first --add-topic single-file --add-topic gpl >/dev/null || true
say "topics set"

say "Issues from docs/FURTHER-WORK.md"
gh label create "further-work" -R "$ORG/$REPO" --color "0e8a16" \
  --description "Planned enhancement from docs/FURTHER-WORK.md" >/dev/null 2>&1 || true
EXISTING="$(gh issue list -R "$ORG/$REPO" --state all --limit 100 --json title -q '.[].title' 2>/dev/null || true)"
while IFS='|' read -r n title; do
  [ -z "${n:-}" ] && continue
  t="FW-$n: $title"
  if printf '%s\n' "$EXISTING" | grep -Fqx "$t"; then
    say "exists, skipping: $t"
  else
    out="$(gh issue create -R "$ORG/$REPO" --title "$t" --label "further-work" \
          --body "Tracked further-work item **#$n** — see [docs/FURTHER-WORK.md](https://github.com/$ORG/$REPO/blob/main/docs/FURTHER-WORK.md) for full context and dependencies.")"
    url "$out"
  fi
done < <(sed -nE 's/^([0-9]+)\. \*\*([^*]+)\*\*.*/\1|\2/p' docs/FURTHER-WORK.md)

say "GitHub Pages (best effort)"
if gh api -X POST "repos/$ORG/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1; then
  say "Pages enabled (main, /)"
else
  say "Pages API call not accepted (may already be enabled, or needs a plan/permission)."
  say "Manual: Settings → Pages → Deploy from branch → main / (root)"
fi
url "https://$ORG.github.io/$REPO/"
url "https://$ORG.github.io/$REPO/index.html?api=panchang&date=2026-08-12&lat=28.61&lon=77.21&tz=5.5"

say "DONE — CHAKRA v1.1.0 published"
