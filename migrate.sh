#!/bin/bash
set -e

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Loading from .env file..."

    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "❌ .env file not found"
        exit 1
    fi
fi

echo "📋 Database: ${DATABASE_URL%%\?*}" | sed 's/:[^:]*@/:****@/'

# Run migrations
echo "🚀 Applying migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

