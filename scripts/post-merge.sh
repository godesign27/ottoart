#!/usr/bin/env bash
set -euo pipefail

# Restore dependencies from the merged lockfile, then verify the production build.
# Database schema changes are handled separately by the publishing workflow.
npm ci --no-audit --no-fund
npm run build
