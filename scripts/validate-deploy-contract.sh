#!/usr/bin/env bash
set -euo pipefail

required_files=(
  Dockerfile
  api/Cargo.toml
  api/Dockerfile
  api/openapi.json
  api/src/main.rs
  nginx.conf
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
)

for required_file in "${required_files[@]}"; do
  if [ ! -r "$required_file" ]; then
    echo "Missing deployment input: $required_file" >&2
    exit 1
  fi
done

node --input-type=commonjs - <<'NODE'
const manifest = require("./package.json");
for (const name of ["build", "check"]) {
  if (!manifest.scripts?.[name]) {
    throw new Error(`Missing required package script: ${name}`);
  }
}
NODE

grep -Fq '"/api/chat/health"' api/openapi.json
grep -Fq '.route("/api/chat/health"' api/src/main.rs
grep -Fq 'apk add --no-cache wget' Dockerfile
grep -Fq 'HEALTHCHECK' Dockerfile

echo "Deployment contract valid: ${#required_files[@]} inputs"
