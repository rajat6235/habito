#!/usr/bin/env bash
# dev.sh — start Habito locally (no Docker required)
# Usage: ./dev.sh        (first run does full setup automatically)
#        ./dev.sh reset  (drop DB and start fresh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

DB_NAME="habito_dev"
DB_USER="habito"
DB_PASS="habito_dev_pass"
PG_BIN=""

# ── Colours ───────────────────────────────────────────────────────────────────
G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; NC="\033[0m"
info()  { echo -e "${G}▶${NC} $*"; }
warn()  { echo -e "${Y}⚠${NC} $*"; }
error() { echo -e "${R}✗${NC} $*"; exit 1; }

# ── Find Postgres binaries ────────────────────────────────────────────────────
for ver in 18 17 16 15 14; do
  candidate="/opt/homebrew/opt/postgresql@${ver}/bin"
  if [[ -x "$candidate/psql" ]]; then
    PG_BIN="$candidate"
    break
  fi
done
[[ -z "$PG_BIN" ]] && PG_BIN="$(dirname "$(which psql 2>/dev/null || true)")"
[[ -z "$PG_BIN" || ! -x "$PG_BIN/psql" ]] && error "PostgreSQL not found. Install: brew install postgresql@16"

export PATH="$PG_BIN:$PATH"

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v node >/dev/null || error "Node.js not found. Install from https://nodejs.org"

# ── Reset mode ────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "reset" ]]; then
  warn "Resetting database…"
  brew services stop "$(basename "$(dirname "$PG_BIN")")" 2>/dev/null || true
  sleep 1
fi

# ── Start Postgres ────────────────────────────────────────────────────────────
PG_SERVICE="postgresql@$(basename "$(dirname "$PG_BIN")" | sed 's/postgresql@//')"
# Resolve actual brew service name from binary path
PG_VER=$(echo "$PG_BIN" | grep -oE 'postgresql@[0-9]+' | head -1 || echo "postgresql")

if ! pg_isready -q 2>/dev/null; then
  info "Starting PostgreSQL ($PG_VER)…"
  brew services start "$PG_VER" 2>/dev/null || true
  # Wait up to 15s
  for i in $(seq 1 15); do
    pg_isready -q 2>/dev/null && break
    sleep 1
  done
  pg_isready -q || error "Postgres did not start. Try: brew services start $PG_VER"
fi
info "PostgreSQL ready."

# ── Create DB user and database (idempotent) ───────────────────────────────────
if [[ "${1:-}" == "reset" ]]; then
  psql -U "$(whoami)" postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
fi

psql -U "$(whoami)" postgres <<SQL 2>/dev/null || true
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
info "Database '$DB_NAME' ready."

# ── Mailpit (email viewer) ────────────────────────────────────────────────────
if ! command -v mailpit >/dev/null 2>&1; then
  info "Installing Mailpit (email viewer)…"
  brew install mailpit 2>/dev/null || warn "Mailpit install failed — emails will only appear in backend logs"
fi
if command -v mailpit >/dev/null 2>&1; then
  pkill -f "mailpit" 2>/dev/null || true
  mailpit --smtp-bind-addr 0.0.0.0:1025 --listen 0.0.0.0:8025 &>/tmp/mailpit.log &
  disown
  info "Mailpit started → http://localhost:8025"
fi

# ── Backend setup ─────────────────────────────────────────────────────────────
info "Installing backend dependencies…"
cd "$BACKEND" && npm install --silent

info "Running database migrations…"
npx prisma migrate deploy

info "Generating Prisma client…"
npx prisma generate --silent

info "Seeding database…"
npx tsx prisma/seed.ts

# ── Frontend setup ────────────────────────────────────────────────────────────
info "Installing frontend dependencies…"
cd "$FRONTEND" && npm install --silent

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${G}  Habito is starting!${NC}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  App:     http://localhost:3000"
echo "  API:     http://localhost:4000"
echo "  Emails:  http://localhost:8025"
echo ""
echo "  Test accounts:"
echo "    admin@habito.local  /  Admin123!  (super-admin)"
echo "    demo@habito.local   /  Demo123!   (regular user)"
echo ""
echo -e "${Y}Press Ctrl+C to stop both servers${NC}"
echo ""

trap 'kill $(jobs -p) 2>/dev/null; exit 0' INT TERM

cd "$BACKEND" && npm run dev &
sleep 2
cd "$FRONTEND" && npm run dev &

wait
