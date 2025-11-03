#!/bin/bash
set -e

echo "Applying database migration..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Apply migration
npx prisma migrate deploy

echo "Migration applied successfully!"

