#!/usr/bin/env bash
# seed-chakra.sh v2 — one-shot publisher for CHAKRA → github.com/project-ilm/chakra
# Idempotent and PARANOID. v1 happily seeded whatever directory it sat in;
# on 2026-07-04 that turned a wrapper folder into the repo root. v2 refuses to
# run unless it is standing inside a genuine CHAKRA tree, refuses nested .git
# directories and stray archives, and publishes onto existing remote history
# with a fetch→graft→fast-forward so re-seeding can never rewrite the repo.
#
# Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
set -euo pipefail
ORG="project-ilm"; REPO="chakra"; VER="1.2.0"
say(){ printf '\n\033[1;36m── %s\033[0m\n' "$*"; }
url(){ printf '\033[1;33m>>> %s\033[0m\n' "$*"; }
die(){ printf '\n\033[1;31mXX %s\033[0m\n' "$*"; exit 1; }

cd "$(cd "$(dirname "$0")" && pwd)"

say "Guard 1/3 — manifest (am I inside the real CHAKRA tree?)"
for f in index.html pro.html learn.html tour.html tests.html \
         src/chakra-core.js src/chakra-site.js lib/chakra.c \
         CONTEXT.md CONTRACTS.md docs/BACKLOG.md \
         docs/FURTHER-WORK.md CHANGELOG.md LICENSE; do
  [ -f "$f" ] || die "missing $f — run this script from INSIDE the extracted chakra/ folder (tar xzf chakra-v$VER.tar.gz && cd chakra && ./seed-chakra.sh). Refusing to seed a wrapper directory."
done
say "manifest OK — $(pwd)"

say "Guard 2/3 — nested repositories"
NESTED="$(find . -name .git -not -path ./.git -not -path './.git/*' 2>/dev/null | head -3 || true)"
[ -z "$NESTED" ] || die "nested .git found: $NESTED — a clone is sitting inside this tree. Remove it (rm -rf) before seeding; committing it would create a broken gitlink."

say "Guard 3/3 — stray archives at root"
STRAY="$(find . -maxdepth 1 \( -name '*.zip' -o -name '*.tar.gz' -o -name '*.tgz' \) 2>/dev/null | head -3 || true)"
[ -z "$STRAY" ] || die "archive(s) at repo root: $STRAY — move or delete them; a repo should not contain its own delivery tarball."

say "Pre-flight"
command -v gh  >/dev/null || die "GitHub CLI (gh) is required: https://cli.github.com"
command -v git >/dev/null || die "git is required"
gh auth status >/dev/null 2>&1 || die "not authenticated — run: gh auth login"
gh api "orgs/$ORG" -q .login >/dev/null 2>&1 || die "cannot reach org '$ORG' with this token"
gh auth setup-git >/dev/null 2>&1 || true
say "auth OK · org '$ORG' reachable"

say "Repository"
REMOTE_EXISTS=0
if gh repo view "$ORG/$REPO" >/dev/null 2>&1; then
  REMOTE_EXISTS=1; say "repo exists — will publish ON TOP of its history"
else
  gh repo create "$ORG/$REPO" --public \
    --description "CHAKRA — Temporal Cycle Observatory: offline multi-tradition astronomical/calendrical observatory, tested JS library, URL→JSON API, and a byte-parity C99 core. GPL-3.0." \
    >/dev/null
  say "repo created"
fi
url "https://github.com/$ORG/$REPO"

say "Commit & push"
if [ ! -d .git ]; then
  git init -b main >/dev/null
  git remote add origin "https://github.com/$ORG/$REPO.git"
  if [ "$REMOTE_EXISTS" = 1 ] && git ls-remote --exit-code origin main >/dev/null 2>&1; then
    say "grafting local tree onto existing remote history (fetch → update-ref → reset)"
    git fetch -q origin main
    git update-ref refs/heads/main FETCH_HEAD
    git reset -q --mixed HEAD
  fi
else
  git remote get-url origin >/dev/null 2>&1 && git remote set-url origin "https://github.com/$ORG/$REPO.git" \
                                            || git remote add origin "https://github.com/$ORG/$REPO.git"
  git fetch -q origin main 2>/dev/null || true
fi
git add -A
say "delta about to be committed (git status --short, first 30 lines):"
git status --short | head -30
CH=$(git status --short | wc -l | tr -d ' ')
say "$CH path(s) changed"
if git -c user.name="Abhishek Choudhary" -c user.email="obonac@users.noreply.github.com" \
   commit -m "CHAKRA v$VER — landing/pro split, learn+tour+tests pages, site themes & share, sky time-drag, true-orbit orrery, terminator globe, api=events, C99 core with 6590-check parity, 98-assertion suite, seed v2 guards" >/dev/null; then
  say "committed"
else
  say "nothing new to commit"
fi
if git push -u origin main; then
  url "https://github.com/$ORG/$REPO  (pushed: main)"
else
  die "push rejected (non-fast-forward?). Do NOT force. Inspect with: git fetch origin && git log --oneline main..origin/main — then reconcile manually."
fi

say "Topics"
gh repo edit "$ORG/$REPO" \
  --add-topic astronomy --add-topic panchang --add-topic calendar --add-topic jyotisha \
  --add-topic hijri --add-topic hebrew-calendar --add-topic nanakshahi --add-topic ephemeris \
  --add-topic offline-first --add-topic gpl --add-topic c99 --add-topic relativity >/dev/null || true
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

say "Issues from docs/BACKLOG.md (B-series)"
gh label create "backlog" -R "$ORG/$REPO" --color "1d76db" \
  --description "Planned work from docs/BACKLOG.md" >/dev/null 2>&1 || true
EXISTING_B="$(gh issue list -R "$ORG/$REPO" --state all --limit 400 --json title -q '.[].title' 2>/dev/null || true)"
python3 - <<'PYEOF' > /tmp/chakra_backlog_issues.tsv
import re
txt=open("docs/BACKLOG.md",encoding="utf-8").read()
blocks=re.split(r'\n### ',txt)
for b in blocks[1:]:
    head,_,body=b.partition("\n")
    m=re.match(r'(B-\d+): (.*)',head.strip())
    if not m: continue
    ident,title=m.group(1),m.group(2).strip()
    # body до next "## " section header
    body=body.split("\n## ")[0].strip()
    print(ident+"\t"+title+"\t"+body.replace("\t"," ").replace("\n","<<NL>>"))
PYEOF
while IFS=$'\t' read -r ident title body; do
  [ -z "${ident:-}" ] && continue
  full="$ident: $title"
  if printf '%s\n' "$EXISTING_B" | grep -Fqx "$full"; then
    say "exists, skipping: $full"
  else
    printf '%b' "${body//<<NL>>/\n}" > /tmp/chakra_issue_body.md
    out="$(gh issue create -R "$ORG/$REPO" --title "$full" --label "backlog" --body-file /tmp/chakra_issue_body.md)"
    url "$out"
  fi
done < /tmp/chakra_backlog_issues.tsv

say "GitHub Pages (best effort)"
if gh api -X POST "repos/$ORG/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1; then
  say "Pages enabled (main, /)"
else
  say "Pages API not accepted (probably already enabled)."
  say "Manual if needed: Settings → Pages → Deploy from branch → main / (root)"
fi
url "https://$ORG.github.io/$REPO/                 (landing)"
url "https://$ORG.github.io/$REPO/pro.html         (observatory)"
url "https://$ORG.github.io/$REPO/learn.html       (mathematics & history)"
url "https://$ORG.github.io/$REPO/tour.html        (interstellar planner)"
url "https://$ORG.github.io/$REPO/tests.html       (run the tests yourself)"
url "https://$ORG.github.io/$REPO/index.html?api=panchang&date=2026-08-12&lat=28.61&lon=77.21&tz=5.5"

say "DONE — CHAKRA v$VER published"
