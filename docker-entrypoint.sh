#!/bin/sh
set -e

echo "Running database migrations..."

# Try multiple paths for Prisma CLI
if [ -f "node_modules/.bin/prisma" ]; then
    echo "Using node_modules/.bin/prisma"
    node_modules/.bin/prisma migrate deploy
elif [ -f "node_modules/prisma/build/index.js" ]; then
    echo "Using node_modules/prisma/build/index.js"
    node node_modules/prisma/build/index.js migrate deploy
elif command -v npx >/dev/null 2>&1; then
    echo "Using npx prisma"
    npx prisma migrate deploy
else
    echo "WARNING: Prisma CLI not found, skipping migrations"
    echo "Please ensure database schema is up to date"
fi

echo "Starting application..."
exec node server.js
