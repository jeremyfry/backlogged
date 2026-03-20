#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Backlogged — Proxmox LXC creation script
# Run this on your Proxmox host as root.
#
# What it does:
#   1. Downloads an Ubuntu 22.04 LXC template (if not already cached)
#   2. Creates and starts a new LXC container
#   3. Installs Docker + Docker Compose inside it
#   4. Clones the repo and starts the app with docker compose
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration — edit these before running ────────────────────────────────
VMID="${VMID:-200}"                        # Proxmox container ID (must be free)
HOSTNAME="${HOSTNAME:-backlogged}"
STORAGE="${STORAGE:-local-lvm}"            # Storage for the container rootfs
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"  # Where to cache the template
DISK_SIZE="${DISK_SIZE:-8}"                # GB
MEMORY="${MEMORY:-1024}"                   # MB
CORES="${CORES:-2}"
BRIDGE="${BRIDGE:-vmbr0}"

# App config — these get written into /opt/backlogged/.env inside the container
APP_PORT="${APP_PORT:-3000}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
INITIAL_USERNAME="${INITIAL_USERNAME:-admin}"
INITIAL_PASSWORD="${INITIAL_PASSWORD:-}"   # Leave blank to use the setup screen

REPO_URL="${REPO_URL:-https://github.com/jeremyfry/backlogged.git}"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root on the Proxmox host."
command -v pct  &>/dev/null || error "pct not found — is this a Proxmox host?"

# ── 1. Template ───────────────────────────────────────────────────────────────
TEMPLATE="ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
TEMPLATE_PATH="${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}"

if ! pveam list "${TEMPLATE_STORAGE}" 2>/dev/null | grep -q "ubuntu-22.04"; then
  info "Downloading Ubuntu 22.04 template..."
  pveam update
  pveam download "${TEMPLATE_STORAGE}" "${TEMPLATE}" || \
    error "Could not download template. Check available templates with: pveam available --section system"
else
  info "Ubuntu 22.04 template already cached."
fi

# ── 2. Create container ───────────────────────────────────────────────────────
if pct status "${VMID}" &>/dev/null; then
  error "Container ID ${VMID} already exists. Set a different VMID= and re-run."
fi

info "Creating LXC container ${VMID} (${HOSTNAME})..."
pct create "${VMID}" "${TEMPLATE_PATH}" \
  --hostname "${HOSTNAME}" \
  --cores "${CORES}" \
  --memory "${MEMORY}" \
  --rootfs "${STORAGE}:${DISK_SIZE}" \
  --net0 name=eth0,bridge="${BRIDGE}",ip=dhcp \
  --features nesting=1 \
  --unprivileged 1 \
  --ostype ubuntu \
  --start 1

info "Waiting for container to boot..."
sleep 5

# ── 3. Bootstrap inside the container ─────────────────────────────────────────
info "Installing Docker inside the container..."
pct exec "${VMID}" -- bash -c "
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo \"\$VERSION_CODENAME\") stable\" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
"

# ── 4. Deploy the app ─────────────────────────────────────────────────────────
info "Deploying Backlogged..."
pct exec "${VMID}" -- bash -c "
  set -euo pipefail
  git clone '${REPO_URL}' /opt/backlogged
  cd /opt/backlogged

  # Write .env
  cat > .env <<'ENVEOF'
JWT_SECRET=${JWT_SECRET}
INITIAL_USERNAME=${INITIAL_USERNAME}
INITIAL_PASSWORD=${INITIAL_PASSWORD}
PORT=${APP_PORT}
ENVEOF

  docker compose up -d --build
"

# ── 5. systemd service so the container auto-starts the app on reboot ─────────
pct exec "${VMID}" -- bash -c "
  cat > /etc/systemd/system/backlogged.service <<'EOF'
[Unit]
Description=Backlogged
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/opt/backlogged
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable backlogged
"

# ── Done ───────────────────────────────────────────────────────────────────────
CONTAINER_IP=$(pct exec "${VMID}" -- hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Backlogged deployed successfully!      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App URL   : ${GREEN}http://${CONTAINER_IP}:${APP_PORT}${NC}"
echo -e "  Container : pct enter ${VMID}"
echo -e "  Logs      : pct exec ${VMID} -- docker compose -C /opt/backlogged logs -f"
echo ""
if [[ -z "${INITIAL_PASSWORD}" ]]; then
  warn "No INITIAL_PASSWORD was set — complete first-time setup in the browser."
else
  echo -e "  Username  : ${INITIAL_USERNAME}"
  warn "Remove INITIAL_USERNAME and INITIAL_PASSWORD from /opt/backlogged/.env"
fi
echo ""
echo -e "  JWT_SECRET: ${JWT_SECRET}"
warn "Save the JWT_SECRET above — you'll need it if you recreate the container."
echo ""
