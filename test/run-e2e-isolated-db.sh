#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_USERNAME="${DB_USERNAME:-demo_backend}"
DB_PASSWORD="${DB_PASSWORD:-mypassword}"
MAIN_DB="${MAIN_DB:-postgres}"
TEST_DB="${TEST_DB:-dreammanagertest}"

export DB_HOST DB_PORT DB_USERNAME DB_PASSWORD
export DB_NAME="$TEST_DB"
export NODE_ENV="test"
export READ_LOCAL_ENV="true"
export FORCE_COLOR=1

cleanup() {
  echo ""
  echo "================================"
  echo "Cleaning up: dropping test database '$TEST_DB'..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$MAIN_DB" \
    -c "DROP DATABASE IF EXISTS \"$TEST_DB\" WITH (FORCE);" >/dev/null 2>&1 || true
  echo "Cleanup done."
  echo "================================"
}

trap cleanup EXIT

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" >/dev/null 2>&1; then
  echo "PostgreSQL is not running/reachable at $DB_HOST:$DB_PORT for user $DB_USERNAME."
  echo "Start DB first (for docker: docker-compose up -d)."
  exit 1
fi

echo "Creating isolated test database '$TEST_DB'..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$MAIN_DB" \
  -c "DROP DATABASE IF EXISTS \"$TEST_DB\" WITH (FORCE);"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$MAIN_DB" \
  -c "CREATE DATABASE \"$TEST_DB\";"

echo "Running migrations on '$TEST_DB'..."
npm run migration:run:local

echo "Cleaning failed tests log..."
rm -f ./test/failed-tests.log

echo ""
echo "================================"
echo "Running E2E Tests..."
echo "================================"

# Keep auth suite first, then run remaining suites.
npx jest --config ./test/jest-e2e.json --runInBand test/auth-e2e/auth.e2e-spec.ts --verbose --detectOpenHandles --forceExit
npx jest --config ./test/jest-e2e.json --runInBand --testPathIgnorePatterns="auth.e2e-spec.ts" --verbose --detectOpenHandles --forceExit

echo ""
echo "================================"
echo "All E2E tests passed."
echo "================================"
