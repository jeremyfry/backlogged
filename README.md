> [!WARNING]
> This project was vibe coded with Claude Code. It has yet to be fully reviewed by a human for security. Use at your own risk.

# BACKLOGGED

**A self-hosted retro game collection tracker.**

Keep tabs on what you own, what you want, and what's next in the queue. BACKLOGGED pulls cover art and metadata from IGDB and time-to-beat estimates from HowLongToBeat, so adding a game takes seconds.

---

## Screenshots

<table>
  <tr>
    <td><img src="screenshots/collection.png" alt="Collection view" /></td>
    <td><img src="screenshots/details.png" alt="Game detail sheet" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/search.png" alt="IGDB game search" /></td>
    <td><img src="screenshots/backlog.png" alt="Up Next queue" /></td>
  </tr>
</table>

---

## Features

- **Collection & Wishlist** — track owned games and a want list separately
- **Status tracking** — Unplayed, Up Next, In Progress, Completed, Dropped
- **IGDB integration** — search for any game and auto-fill cover art, platform, release year, genre, and developer
- **HowLongToBeat** — fetches Main Story / Extras / 100% estimates automatically
- **Personal playthrough** — log your own completion date and hours played
- **Backlog queue** — drag-and-drop reordering for your Up Next list
- **Filter & search** — filter by status and platform, full-text search
- **Purchase tracking** — condition, price paid, date acquired, where you bought it
- **Retro aesthetic** — dark UI with pixel fonts and animated game controller buttons in the background
- **Single-container deploy** — one Docker image, SQLite on a volume, no external database

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend  | Node.js, Express, TypeScript |
| Database | SQLite via Drizzle ORM |
| Auth     | JWT (single-user) |
| Deploy   | Docker, Docker Compose |

---

## Quick Start

```bash
git clone https://github.com/jeremyfry/backlogged.git
cd backlogged
sudo bash scripts/install.sh
```

The script will install Node.js 22, build the app, generate a `.env` with a random `JWT_SECRET`, and register a systemd service. Open **http://\<server-ip\>:3000** — the app will walk you through account setup on first load.

---

## Configuration

All configuration is via environment variables or the `.env` file (created automatically by the install script).

| Variable             | Required | Description |
|----------------------|----------|-------------|
| `JWT_SECRET`         | Yes      | Secret for signing auth tokens. Generate with `openssl rand -hex 32`. |
| `PORT`               | No       | Port to listen on (default: `3000`). |
| `IGDB_CLIENT_ID`     | No       | Twitch/IGDB client ID for game search. Get one at [dev.twitch.tv](https://dev.twitch.tv/console). |
| `IGDB_CLIENT_SECRET` | No       | Twitch/IGDB client secret. |
| `DATABASE_PATH`      | No       | Override the SQLite file path (default: `data/backlogged.db`). |
| `CONFIG_PATH`        | No       | Override the config file path (default: `data/config.json`). |

### Password Reset

If you get locked out, write a file at `data/reset-pass.txt` (relative to the repo root) containing your new password. The server reads and deletes it on next startup.

```bash
echo "newpassword" > /opt/backlogged/data/reset-pass.txt
sudo systemctl restart backlogged
```

To change both username and password: `newusername:newpassword`

---

## Proxmox LXC

Create an unprivileged Ubuntu 22.04 LXC container in Proxmox, then inside it:

```bash
apt-get update && apt-get install -y git
git clone https://github.com/jeremyfry/backlogged.git /opt/backlogged
cd /opt/backlogged
sudo bash scripts/install.sh
```

The install script handles everything else — Node.js, build, `.env`, and the systemd service.

---

## Development

```bash
# Install dependencies
npm install

# Start backend + frontend dev servers
npm run dev

# Run tests
npm test
```

The backend runs on `http://localhost:3001` and the frontend dev server proxies API requests automatically.

---

## License

MIT
