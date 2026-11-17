# Server setup: Wearther Mode

Three containers behind one domain:

| Service | What it does | RAM |
|---|---|---|
| `web` (Caddy) | Serves the PWA, gets the HTTPS certificate, forwards `/api` | ~30 MB |
| `api` (Node) | Sign-in by email code, weather from MET Norway, closet + photo backup, 7-day trial, morning push | ~80 MB |
| `cutout` (Python) | Removes the background from clothing photos | ~1.2 GB (`u2net`) or ~2 GB (`isnet-general-use`) |

**Server:** Ubuntu 22.04 / 24.04, **2 GB RAM minimum** (4 GB comfortable), 2 vCPU, 15 GB disk.
Run every command as a normal user with `sudo` rights.

## 0. Before you start
- Pick a domain or subdomain, e.g. `app.example.com`, and create a DNS **A record** pointing it to the server's public IP.
- Make sure ports **80** and **443** are open in your hosting provider's firewall.
- **Read and accept MET Norway's terms** (a person must accept them, not a tool): https://docs.api.met.no/doc/TermsOfService

## 1. Install Git and Docker
```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
newgrp docker
docker compose version
```

### 1b. Only if the server is in Iran (Docker Hub returns 403)
```bash
sudo mkdir -p /etc/docker
[ -f /etc/docker/daemon.json ] && sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "registry-mirrors": ["https://docker.arvancloud.ir", "https://mirror-docker.runflare.com"]
}
JSON
sudo systemctl restart docker
docker info | grep -A3 "Registry Mirrors"
```
If `daemon.json` already had settings, merge the `registry-mirrors` key into it instead of overwriting (the backup is `daemon.json.bak`).

### 1c. Only on a 2 GB server: add 2 GB of swap so builds and the cut-out model never run out of memory
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 2. Give the server read-only access to the private repo (deploy key)
```bash
ssh-keygen -t ed25519 -C "wearther-server" -f ~/.ssh/wearther_deploy -N ""
cat ~/.ssh/wearther_deploy.pub
```
Copy the printed line into **https://github.com/hossein2436/wearther-mode/settings/keys** → *Add deploy key*. Title: `server`. Leave *Allow write access* **unchecked**.

```bash
cat >> ~/.ssh/config <<'EOF2'
Host github-wearther
  HostName github.com
  User git
  IdentityFile ~/.ssh/wearther_deploy
  IdentitiesOnly yes
EOF2
chmod 600 ~/.ssh/config
ssh -T github-wearther    # type "yes" once; expect "successfully authenticated"
```

## 3. Get the code and configure it
```bash
sudo mkdir -p /opt/wearther && sudo chown "$USER": /opt/wearther
git clone github-wearther:hossein2436/wearther-mode.git /opt/wearther/app
cd /opt/wearther/app
cp .env.example .env
nano .env
```
In `.env`, set at least:
- `SITE_ADDRESS=app.example.com` (your domain)
- `CONTACT_EMAIL=you@yourdomain.com` (MET Norway requires a contact in every request)
- `SMTP_URL=...` if you have an SMTP account for sign-in emails. Leave it empty to start: codes then appear in the logs (step 6).
- On a 4 GB+ server you can set `REMBG_MODEL=isnet-general-use` for cleaner cut-outs.

## 4. Open the firewall (only if ufw is active)
```bash
sudo ufw status
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
```

## 5. Build and start
```bash
cd /opt/wearther/app
docker compose up -d --build          # first build takes 5–15 minutes
docker compose ps                     # all three should be "running"; cutout becomes "healthy" after the model download
docker compose logs -f web            # wait for "certificate obtained successfully", then Ctrl+C
```

## 6. Check it
```bash
curl -s https://app.example.com/api/health                                    # {"ok":true}
curl -s "https://app.example.com/api/weather?city=London&tz=Europe/London" | head -c 300   # real MET forecast
docker compose logs cutout | tail -5                                           # model downloaded and loaded
```
Open the domain on your phone and go through sign-up. **No SMTP yet?** Get your sign-in code with:
```bash
docker compose logs api | grep "login code" | tail -1
```
iPhone: Safari → Share → Add to Home Screen. Android: Chrome → Install app.

## Everyday commands
```bash
cd /opt/wearther/app
./deploy/update.sh                                              # pull latest code, rebuild, restart
docker compose logs -f api                                      # live API logs
docker compose exec api node dist/admin.js users                # list users and trial status
docker compose exec api node dist/admin.js grant you@x.com 365  # free subscription (e.g. for you or testers)
docker compose exec api node dist/admin.js revoke you@x.com
```

## Backups (do this before you have real users)
Everything that matters is in the `api_data` volume (database, closet photos, keys):
```bash
mkdir -p ~/backups
docker run --rm -v app_api_data:/data -v ~/backups:/backup alpine tar czf /backup/wearther-$(date +%F).tgz -C /data .
```
The volume name is `<folder>_api_data`; with the folder `/opt/wearther/app` it's `app_api_data` (`docker volume ls` shows it).
Restore: stop the stack, then `docker run --rm -v app_api_data:/data -v ~/backups:/backup alpine sh -c "cd /data && tar xzf /backup/wearther-YYYY-MM-DD.tgz"`.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `bind: address already in use` on 80/443 | `sudo ss -ltnp \| grep -E ':80 \|:443 '` shows the other web server. Stop it, or set `HTTP_PORT=8080` / `HTTPS_PORT=8443` in `.env` and proxy to it |
| `403 Forbidden` pulling `node`, `caddy` or `python` | Do step 1b |
| `npm ci` or `pip install` very slow / times out | Set `NPM_REGISTRY` / `PIP_INDEX_URL` in `.env` to a closer mirror, then `docker compose build --no-cache` |
| `cutout` restarting, `Killed` in logs | Out of memory: do step 1c, or keep `REMBG_MODEL=u2net` |
| Weather says "offline" in the app | `docker compose logs api \| grep -i met`; the server must reach `api.met.no` |
| No certificate / `challenge failed` | DNS A record not pointing here yet (`dig +short app.example.com`), or port 80 blocked |
| Can't sign in when testing on `http://SERVER_IP` | Set `SITE_ADDRESS=:80` and `COOKIE_SECURE=false` in `.env`, then `docker compose up -d` (install and push need a real domain) |
