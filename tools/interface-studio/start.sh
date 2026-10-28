#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
node_bin="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
if [ -x "$node_bin/node" ]; then PATH="$node_bin:$PATH"; fi
if [ -x "$root/.openbot-build/studio-toolchain/bun" ]; then PATH="$root/.openbot-build/studio-toolchain:$PATH"; fi
export PATH
node_major=$(node -p 'Number(process.versions.node.split(".")[0])')
if [ "$node_major" -lt 24 ]; then printf '%s\n' 'OpenBot Studio needs Node.js 24 or newer.' >&2; exit 1; fi
cd "$root"
exec bun run storybook --no-open --host 127.0.0.1
