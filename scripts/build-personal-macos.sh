#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != Darwin ]]; then echo 'This build requires macOS.' >&2; exit 1; fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'The worktree must be clean before building.' >&2; exit 1
fi
branch=$(git symbolic-ref --quiet --short HEAD) || { echo 'A branch is required.' >&2; exit 1; }
revision=$(git rev-parse HEAD)
short_revision=$(git rev-parse --short=12 HEAD)
stamp=$(date -u +%Y%m%dT%H%M%SZ)
tag="personal-macos-${stamp}-${short_revision}"
# This personal fork keeps builds in one directory, regardless of the source worktree.
root="/Users/sashareushkin/projects/openbot/sync-v0.52.1/dist"
[[ -d "$root" && ! -L "$root" ]] || { echo 'The personal build directory is unavailable.' >&2; exit 1; }
lock="$root/.personal-build.lock"
mkdir "$lock" || { echo 'Another personal build is running, or its lock needs review.' >&2; exit 1; }
output=""
complete=0
cleanup() {
  if [[ $complete -eq 0 && -n "$output" ]]; then rm -rf -- "$output"; fi
  rm -f -- "$lock/removals"
  rmdir "$lock"
}
trap cleanup EXIT
# Compare numeric version components, not lexicographic directory names.
major=0 minor=0 patch=-1
shopt -s nullglob
for build in "$root"/fork-v*; do
  [[ -d "$build" && ! -L "$build" ]] || continue
  name=${build##*/}
  if [[ "$name" =~ ^fork-v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    a=$((10#${BASH_REMATCH[1]})) b=$((10#${BASH_REMATCH[2]})) c=$((10#${BASH_REMATCH[3]}))
    if (( a > major || (a == major && b > minor) || (a == major && b == minor && c > patch) )); then
      major=$a minor=$b patch=$c
    fi
  fi
done
if (( patch < 0 )); then
  echo 'No numbered fork build found in the primary dist directory.' >&2; exit 1
fi
next_patch=$((patch + 1))
candidate="$root/fork-v${major}.${minor}.${next_patch}"
if git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then
  echo 'Build tag already exists. Try again.' >&2; exit 1
fi
# mkdir is atomic: a concurrent build cannot take the same number.
mkdir "$candidate" || { echo 'Build directory already exists. Try again.' >&2; exit 1; }
output="$candidate"

bun run voice:prepare-runtime
bun run prepare:remote-desktop-runtime
bun run verify:remote-desktop-runtime
bun run prepare:cua-driver
bun run build
bunx electron-builder --dir --mac --config electron-builder.fork.yml --config.mac.identity=null --config.mac.notarize=false "--config.directories.output=$output"
arch=$(uname -m)
case "$arch" in arm64) app="$output/mac-arm64/OpenBot.app" ;; x86_64) app="$output/mac/OpenBot.app" ;; *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; esac
bun scripts/verify-macos-package.ts "$app" app.openbot.personal
if [[ "$(git rev-parse HEAD)" != "$revision" ]] || [[ -n "$(git status --porcelain)" ]]; then
  echo 'Source changed during the build. No release tag was created.' >&2; exit 1
fi
git tag -a "$tag" "$revision" -m "Personal macOS build $tag"
printf 'revision=%s\nbranch=%s\ntag=%s\nbuild=%s\n' "$revision" "$branch" "$tag" "${output##*/}" > "$output/BUILD-INFO"
complete=1

# Retain the new build and the two previous numbered builds. Never remove a running app.
# Only actual build directories qualify; unrelated directories are not touched.
bun -e '
const fs = require("node:fs"); const path = require("node:path");
const root = process.argv[1];
const builds = fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const match = /^fork-v(\d+)\.(\d+)\.(\d+)$/.exec(entry.name);
  if (!entry.isDirectory() || !match) return [];
  const dir = path.join(root, entry.name);
  if (!fs.existsSync(path.join(dir, "mac-arm64/OpenBot.app")) && !fs.existsSync(path.join(dir, "mac/OpenBot.app"))) return [];
  return [{ dir, version: match.slice(1).map(Number) }];
});
builds.sort((a, b) => b.version[0] - a.version[0] || b.version[1] - a.version[1] || b.version[2] - a.version[2]);
for (const build of builds.slice(3)) console.log(build.dir);
' "$root" > "$lock/removals"
while IFS= read -r build; do
  [[ -n "$build" ]] || continue
  if ps -axo command= | grep -F -- "$build/" | grep -v -F 'grep -F' >/dev/null; then
    echo "Keeping a running build: $build" >&2
    continue
  fi
  rm -rf -- "$build"
done < "$lock/removals"

printf 'Verified app: %s\nTag: %s\n' "$app" "$tag"
