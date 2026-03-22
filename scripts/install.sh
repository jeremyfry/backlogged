#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Backlogged — install script
# Run from the root of the cloned repo as root (or with sudo).
#
# What it does:
#   1. Installs Node.js 22 if not present
#   2. Installs dependencies and builds the app
#   3. Writes .env with a generated JWT_SECRET (if not already present)
#   4. Creates a systemd service and starts it
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root (or with sudo)."

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PORT="${PORT:-3000}"
SERVICE_USER="${SERVICE_USER:-backlogged}"

# ── 1. Node.js ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node --version)" != v22* ]]; then
  info "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
else
  info "Node.js $(node --version) already installed."
fi

# ── 2. Build ──────────────────────────────────────────────────────────────────
info "Installing dependencies and building..."
cd "${REPO_DIR}"
npm ci
npm run build

# ── 3. .env ───────────────────────────────────────────────────────────────────
ENV_FILE="${REPO_DIR}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  info "Generating .env..."
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > "${ENV_FILE}" <<EOF
JWT_SECRET=${JWT_SECRET}
PORT=${APP_PORT}
EOF
  warn "Generated JWT_SECRET — save this somewhere safe:"
  echo ""
  echo "  JWT_SECRET: ${JWT_SECRET}"
  echo ""
else
  info ".env already exists, leaving it unchanged."
fi

# ── 4. Service user ───────────────────────────────────────────────────────────
if ! id "${SERVICE_USER}" &>/dev/null; then
  info "Creating service user '${SERVICE_USER}'..."
  useradd --system --no-create-home --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${REPO_DIR}"

# ── 5. systemd service ────────────────────────────────────────────────────────
SERVICE_FILE="/etc/systemd/system/backlogged.service"
info "Writing systemd service..."
cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Backlogged
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${REPO_DIR}
EnvironmentFile=${REPO_DIR}/.env
ExecStart=$(command -v node) backend/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable backlogged
systemctl restart backlogged

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Backlogged deployed successfully!      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App URL : ${GREEN}http://$(hostname -I | awk '{print $1}'):${APP_PORT}${NC}"
echo -e "  Logs    : journalctl -u backlogged -f"
echo -e "  Status  : systemctl status backlogged"
echo ""
warn "Complete first-time account setup in the browser."
echo ""
