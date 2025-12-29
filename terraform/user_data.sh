#!/bin/bash
set -e

# Redirect output to log for debugging
exec > >(tee /var/log/user_data.log|logger -t user-data -s 2>/dev/null) 2>&1

# Update and install Docker + extras
yum update -y
yum install -y docker git
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

# Install Docker Compose V2 (yum version is more stable on AL2023)
yum install -y docker-compose-plugin

# ---------------------------
# Install Cloudflare Tunnel (cloudflared)
# ---------------------------
cat <<EOF > /etc/yum.repos.d/cloudflared.repo
[cloudflared]
name=Cloudflared
baseurl=https://pkg.cloudflare.com/cloudflared/rpm
enabled=1
gpgcheck=0
EOF

yum install -y cloudflared

# Install as a systemd service using the token
cloudflared service install --token ${cloudflare_tunnel_token}
systemctl enable cloudflared
systemctl start cloudflared

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Write Nginx Config (escaped for Nginx vars)
cat <<EOT > nginx.conf
server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/certs/origin.crt;
    ssl_certificate_key /etc/nginx/certs/origin.key;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;

        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOT

# Write Docker Compose File
cat <<EOT > docker-compose.yml
services:
  app:
    image: ghcr.io/dushyant-rahangdale/opssentinal-test:latest
    container_name: opssentinal
    restart: always
    expose:
      - "3000"
    env_file:
      - .env
    depends_on:
      - db
    command: >
      sh -c "node node_modules/prisma/build/index.js migrate deploy && node server.js"

  db:
    image: postgres:15-alpine
    container_name: opssentinal_db
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    container_name: opssentinal_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup

volumes:
  postgres_data:
EOT

chown ec2-user:ec2-user docker-compose.yml nginx.conf

# Create .env file with injected secrets
cat <<ENV > .env
DATABASE_URL="postgresql://ops_user:${db_password}@db:5432/opssentinal"
NEXTAUTH_SECRET="${nextauth_secret}"
NEXTAUTH_URL="${nextauth_url}"

POSTGRES_USER="ops_user"
POSTGRES_PASSWORD="${db_password}"
POSTGRES_DB="opssentinal"
ENV

chown ec2-user:ec2-user .env

# Write Certificates
mkdir -p /home/ec2-user/app/certs
cat <<CERT > /home/ec2-user/app/certs/origin.crt
${origin_cert}
CERT

cat <<KEY > /home/ec2-user/app/certs/origin.key
${origin_key}
KEY

chown -R ec2-user:ec2-user /home/ec2-user/app/certs
chmod 600 /home/ec2-user/app/certs/origin.key

# Login to GHCR
echo "${github_token}" | docker login ghcr.io -u ${github_username} --password-stdin

# Start script
cat <<'SCRIPT' > /home/ec2-user/app/start.sh
#!/bin/bash
set -e
cd /home/ec2-user/app

docker compose pull
docker compose up -d db

echo "Waiting for database to be ready..."
until docker compose exec -T db pg_isready -U ops_user -d opssentinal; do
  echo "Database is not ready yet... sleeping"
  sleep 2
done

docker compose up -d
SCRIPT

chmod +x /home/ec2-user/app/start.sh
chown ec2-user:ec2-user /home/ec2-user/app/start.sh

# Initial Launch
/home/ec2-user/app/start.sh
