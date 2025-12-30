#!/bin/bash
set -euo pipefail

# Log everything for debugging
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/null) 2>&1
echo "==> user-data start: $(date -Is)"

# ---------------------------
# Install Docker (AL2023)
# ---------------------------
dnf update -y
dnf install -y docker git curl-minimal

systemctl enable --now docker
usermod -a -G docker ec2-user || true

# ---------------------------
# Install Docker Compose (binary)
# ---------------------------
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
/usr/local/bin/docker-compose version

# ---------------------------
# Install Cloudflare Tunnel (cloudflared)
# ---------------------------
cat <<'EOF' > /etc/yum.repos.d/cloudflared.repo
[cloudflared]
name=Cloudflared
baseurl=https://pkg.cloudflare.com/cloudflared/rpm
enabled=1
gpgcheck=0
EOF

dnf clean all
dnf makecache -y
dnf install -y cloudflared
cloudflared --version

# token is passed as ARGUMENT (not --token)
cloudflared service install "${cloudflare_tunnel_token}"

systemctl daemon-reload
systemctl enable --now cloudflared
systemctl status cloudflared || true

# ---------------------------
# Create app directory
# ---------------------------
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# ---------------------------
# Attach Persistent Volume
# ---------------------------
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=${aws_region}
VOLUME_ID=${volume_id}

echo "Attaching volume $VOLUME_ID to instance $INSTANCE_ID in region $REGION"

# Install AWS CLI (v2)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install

# Attach Volume
aws ec2 attach-volume --volume-id $VOLUME_ID --instance-id $INSTANCE_ID --device /dev/sdf --region $REGION

# Wait for device to appear
DEVICE="/dev/sdf"
# On Nitro instances (like t3), it might show up as /dev/nvme*n1.
# We loop to find the new device that matches our volume attachment.
echo "Waiting for volume to attach..."
for i in {1..45}; do
  if [ -e "/dev/sdf" ]; then
    DEVICE="/dev/sdf"
    break
  fi
  # Check nvme devices if sdf is not there (AWS renames devices on Nitro)
  # This finds the device name (e.g., nvme1n1) that matches the volume serial (stripped of dashes)
  # AWS NVMe serials often contain the volume ID without dashes.
  # Note: lsblk -o SERIAL might not show the full ID on some older kernels, but usually works on AL2023.
  # Fallback: just look for the second disk if only 2 exist or check nvme names.
  # Better approach for AL2023:
  NVME_DEVICE=$(lsblk -d -o NAME,SERIAL | grep "$${VOLUME_ID//-/}" | awk '{print $1}')
  if [ -n "$NVME_DEVICE" ]; then
     DEVICE="/dev/$NVME_DEVICE"
     break
  fi
  sleep 2
done

echo "Volume attached at $DEVICE"

# Create Mount Point
MOUNT_POINT="/mnt/postgres_data"
mkdir -p $MOUNT_POINT

# Format if needed (check for filesystem)
if ! file -s $DEVICE | grep -q "filesystem"; then
    echo "Formatting new volume..."
    mkfs.ext4 $DEVICE
fi

# Mount
mount $DEVICE $MOUNT_POINT || echo "Mount failed, checking if already mounted"
echo "$DEVICE $MOUNT_POINT ext4 defaults,nofail 0 2" >> /etc/fstab

# Ensure permissions (70:70 is standard postgres uid:gid in alpine image)
chown -R 70:70 $MOUNT_POINT
chmod 700 $MOUNT_POINT


# ---------------------------
# Write Nginx Config
# ---------------------------
cat <<'EOT' > nginx.conf
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Since Cloudflare is HTTPS externally, force https here for apps like NextAuth
        proxy_set_header X-Forwarded-Proto https;

        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOT

# ---------------------------
# Write Docker Compose File
# ---------------------------
cat <<'EOT' > docker-compose.yml
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
      - /mnt/postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: $${POSTGRES_USER}
      POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
      POSTGRES_DB: $${POSTGRES_DB}
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
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_NOTIFICATIONS=slack
      - WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL=https://hooks.slack.com/services/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
      - WATCHTOWER_NOTIFICATION_SLACK_IDENTIFIER=opssentinal
    command: --interval 300 --cleanup --notifications-level=info
EOT

chown ec2-user:ec2-user docker-compose.yml nginx.conf

# ---------------------------
# Login to GHCR (don’t kill userdata if it fails)
# ---------------------------
echo "${github_token}" | docker login ghcr.io -u "${github_username}" --password-stdin || echo "GHCR login failed"

# ---------------------------
# Create .env file
# ---------------------------
cat <<ENV > .env
DATABASE_URL="postgresql://ops_user:${db_password}@db:5432/opssentinal"
NEXTAUTH_SECRET="${nextauth_secret}"
NEXTAUTH_URL="${nextauth_url}"

POSTGRES_USER="ops_user"
POSTGRES_PASSWORD="${db_password}"
POSTGRES_DB="opssentinal"
ENV

chown ec2-user:ec2-user .env
chmod 600 .env

# ---------------------------
# Write Certificates
# ---------------------------
mkdir -p /home/ec2-user/app/certs
cat <<CERT > /home/ec2-user/app/certs/origin.crt
${origin_cert}
CERT

cat <<KEY > /home/ec2-user/app/certs/origin.key
${origin_key}
KEY

chown -R ec2-user:ec2-user /home/ec2-user/app/certs
chmod 600 /home/ec2-user/app/certs/origin.key

# ---------------------------
# Start script
# ---------------------------
cat <<'SCRIPT' > /home/ec2-user/app/start.sh
#!/bin/bash
set -euo pipefail
cd /home/ec2-user/app

/usr/local/bin/docker-compose pull
/usr/local/bin/docker-compose up -d db

echo "Waiting for database to be ready..."
until /usr/local/bin/docker-compose exec -T db pg_isready -U ops_user -d opssentinal >/dev/null 2>&1; do
  sleep 2
done

/usr/local/bin/docker-compose up -d
SCRIPT

chmod +x /home/ec2-user/app/start.sh
chown ec2-user:ec2-user /home/ec2-user/app/start.sh

/home/ec2-user/app/start.sh

echo "==> user-data end: $(date -Is)"
