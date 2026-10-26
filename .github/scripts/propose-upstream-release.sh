#!/usr/bin/env bash
set -euo pipefail

upstream=nightly-labs/openbot
current=$(cat .github/upstream-release.txt)
latest=$(gh api "repos/$upstream/releases/latest" --jq .tag_name)
if [[ ! "$latest" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Unexpected release tag: $latest" >&2
  exit 1
fi
if [[ "$latest" == "$current" ]]; then
  echo "Already tracking $current."
  exit 0
fi
branch="sync/upstream-$latest"
if git ls-remote --exit-code --heads origin "$branch" >/dev/null; then
  if gh pr list --repo "$GITHUB_REPOSITORY" --base "$GITHUB_REF_NAME" --head "$branch" --state open --json number --jq 'length' | grep -qx 1; then
    echo "An open pull request already exists for $latest; leaving it unchanged."
    exit 0
  fi
  echo "Branch $branch exists without an open pull request; manual review required." >&2
  exit 1
fi

git fetch --no-tags https://github.com/nightly-labs/openbot.git "refs/tags/$latest:refs/tags/$latest"
if git merge-base --is-ancestor "refs/tags/$latest" HEAD; then
  echo "Release $latest is already contained in the current branch; inspect the release marker." >&2
  exit 1
fi
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git switch -c "$branch"
if ! git merge --no-ff --no-commit "refs/tags/$latest"; then
  git merge --abort
  echo "Merge conflicts with $latest; no branch was pushed. Resolve the update manually." >&2
  exit 1
fi
printf '%s\n' "$latest" > .github/upstream-release.txt
git add .github/upstream-release.txt
git commit -m "Merge upstream OpenBot $latest"
git push origin "HEAD:refs/heads/$branch"
gh pr create --repo "$GITHUB_REPOSITORY" --base "$GITHUB_REF_NAME" --head "$branch" \
  --title "Update OpenBot to $latest" \
  --body "## Linked issue

Not applicable.

## Type of change

- [x] Upstream release update

## What changed

Merge upstream release $latest over $current. Review the upstream release notes and affected surfaces.

## Verification

- [ ] Review the changes and run relevant checks.
- [ ] Verify the macOS and iOS clients before merging.
- [ ] Check that no credentials or private data are included.

## Risk and security impact

Not yet reviewed. Check upstream changes, including workflow files and migrations. This pull request does not merge automatically."
