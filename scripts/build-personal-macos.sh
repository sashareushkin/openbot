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
root="$PWD/dist/personal-macos"
mkdir -p "$root"
output="$root/$tag"
if [[ -e "$output" ]] || git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then
  echo 'Build identifier already exists. Try again.' >&2; exit 1
fi
mkdir "$output"
complete=0
cleanup_failed() { if [[ $complete -eq 0 ]]; then rm -rf -- "$output"; fi; }
trap cleanup_failed EXIT

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
printf 'revision=%s\nbranch=%s\ntag=%s\n' "$revision" "$branch" "$tag" > "$output/BUILD-INFO"
complete=1
trap - EXIT

# Only directories created by this script and marked as complete are eligible for removal.
# Preserve a running copy even if that temporarily leaves more than two builds.
count=0
while IFS= read -r build; do
  [[ -f "$build/BUILD-INFO" ]] || continue
  count=$((count + 1))
  [[ $count -le 2 ]] && continue
  if ps -axo command= | grep -F -- "$build/" | grep -v -F 'grep -F' >/dev/null; then
    echo "Keeping a running build: $build" >&2
    continue
  fi
  rm -rf -- "$build"
done < <(find "$root" -mindepth 1 -maxdepth 1 -type d -name 'personal-macos-*' -print | LC_ALL=C sort -r)
printf 'Verified app: %s\nTag: %s\n' "$app" "$tag"
