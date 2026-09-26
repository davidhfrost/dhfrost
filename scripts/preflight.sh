#!/usr/bin/env bash
# Checks to run before opening or updating a PR.
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm lint
pnpm build
