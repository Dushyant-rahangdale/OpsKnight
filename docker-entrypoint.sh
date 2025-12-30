#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Use direct path to Prisma (works in Next.js standalone build)
if [ -f "node_modules/prisma/build/index.js" ]; then
    node node_modules/prisma/build/index.js migrate deploy
    echo "✅ Migrations completed successfully"
else
    echo "⚠️  Prisma not found, skipping migrations"
fi

echo "🚀 Starting application..."
exec node server.js
