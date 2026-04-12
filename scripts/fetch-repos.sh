#!/usr/bin/env bash
# Fetches all public repos for DiamonDinoia from GitHub API
# and merges them into data/projects.json, preserving curated entries.
set -euo pipefail

GITHUB_USER="DiamonDinoia"
OUT="data/projects.json"
TMPFILE=$(mktemp)

# Fetch all public repos (paginated, up to 300)
repos="[]"
page=1
while true; do
  batch=$(curl -sf "https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&page=${page}&sort=updated" \
    -H "Accept: application/vnd.github.v3+json" \
    ${GITHUB_TOKEN:+-H "Authorization: Bearer ${GITHUB_TOKEN}"})
  count=$(echo "$batch" | jq length)
  [ "$count" -eq 0 ] && break
  repos=$(echo "$repos" "$batch" | jq -s '.[0] + .[1]')
  page=$((page + 1))
done

total=$(echo "$repos" | jq length)

# Also fetch repos from orgs the user contributes to (flatironinstitute, TRIQS, xtensor-stack)
for org in flatironinstitute TRIQS xtensor-stack; do
  page=1
  while true; do
    batch=$(curl -sf "https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&sort=updated" \
      -H "Accept: application/vnd.github.v3+json" \
      ${GITHUB_TOKEN:+-H "Authorization: Bearer ${GITHUB_TOKEN}"} 2>/dev/null || echo "[]")
    count=$(echo "$batch" | jq length)
    [ "$count" -eq 0 ] && break
    repos=$(echo "$repos" "$batch" | jq -s '.[0] + .[1]')
    page=$((page + 1))
  done
done

# Curated projects — these keep their hand-written descriptions
curated=$(jq '.projects' "$OUT")

# Build the new project list: curated first, then remaining personal repos
# (skip forks, skip repos already in curated list)
curated_urls=$(echo "$curated" | jq -r '.[].url')

remaining=$(echo "$repos" | jq --argjson curated "$curated" '
  [($curated | .[].url | ascii_downcase)] as $urls |
  [ .[] | select(.fork == false and .archived == false) |
    select((.html_url | ascii_downcase) as $u | ($urls | index($u)) == null) |
    {
      name: .name,
      url: .html_url,
      langs: (if .language then [.language] else [] end),
      description: (.description // ""),
      stars: .stargazers_count
    }
  ] | sort_by(-.stars)
')

# Merge: curated + top remaining repos
jq -n \
  --arg url "https://github.com/${GITHUB_USER}" \
  --argjson total "$total" \
  --argjson curated "$curated" \
  --argjson remaining "$remaining" \
  '{
    github_url: $url,
    total_repos: $total,
    projects: $curated,
    other_repos: $remaining
  }' > "$TMPFILE"

mv "$TMPFILE" "$OUT"
echo "Updated $OUT: $(jq '.projects | length' "$OUT") curated + $(jq '.other_repos | length' "$OUT") other repos (total: $total personal)"
