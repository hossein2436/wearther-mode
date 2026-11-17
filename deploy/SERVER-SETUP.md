# Server setup: Wearther Mode PWA

Tested target: **Ubuntu 22.04 / 24.04**, 1 vCPU, 1 GB RAM, 10 GB disk (the current PWA is static; the image is about 60 MB).
Run every command as a normal user with `sudo` rights.

## 0. Before you start
- Pick a domain or subdomain, e.g. `app.example.com`, and create a DNS **A record** pointing it to the server's public IP.
- Make sure ports **80** and **443** are open in your hosting provider's firewall.
- PWA install and push notifications need **HTTPS**, so you need the domain. Caddy gets the certificate automatically.

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
If `daemon.json` already had settings, merge the `registry-mirrors` key into it instead of overwriting it (the backup is `daemon.json.bak`).

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
sed -i 's|^SITE_ADDRESS=.*|SITE_ADDRESS=app.example.com|' .env   # ← your domain
cat .env
```

## 4. Open the firewall (only if ufw is active)
```bash
sudo ufw status
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
```

## 5. Build and start
```bash
cd /opt/wearther/app
docker compose up -d --build
docker compose logs -f web      # wait for "certificate obtained successfully", then Ctrl+C
```

## 6. Check it
```bash
curl -I https://app.example.com            # expect HTTP/2 200
curl -I https://app.example.com/sw.js      # expect cache-control: no-cache
```
Open the domain on your phone. iPhone: Safari → Share → Add to Home Screen. Android: Chrome → Install app.

## Updating later
```bash
cd /opt/wearther/app && ./deploy/update.sh
```

## Troubleshooting
| Symptom | Fix |
|---|---|
| `bind: address already in use` on 80/443 | `sudo ss -ltnp \| grep -E ':80 \|:443 '` to find the other web server. Stop it, or set `HTTP_PORT=8080` / `HTTPS_PORT=8443` in `.env` and proxy to it |
| `403 Forbidden` pulling `node` or `caddy` | Do step 1b |
| `npm ci` is very slow or times out | Set `NPM_REGISTRY=<a closer npm mirror>` in `.env`, then `docker compose build --no-cache` |
| No certificate / `challenge failed` | DNS A record not pointing here yet (`dig +short app.example.com`), or port 80 blocked |
| Quick test without a domain | `SITE_ADDRESS=:80` in `.env`, open `http://SERVER_IP` (works, but no install or push without HTTPS) |
