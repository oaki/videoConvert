#!/bin/bash

LOG_FILE="migration-mark-applied.log"

echo "====================================" | tee -a $LOG_FILE
echo "Marking Migration as Applied" | tee -a $LOG_FILE
echo "Started at: $(date)" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE

# Load environment variables
if [ -f .env ]; then
    echo "Loading .env file..." | tee -a $LOG_FILE
    set -a
    source .env
    set +a
else
    echo "ERROR: .env file not found!" | tee -a $LOG_FILE
    exit 1
fi

echo "Database: ${DATABASE_URL%%\?*}" | sed 's/:[^:]*@/:****@/' | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Mark the migration as applied since the column already exists
echo "Marking migration as applied (column already exists)..." | tee -a $LOG_FILE
npx prisma migrate resolve --applied 20251030225052_add_asset_data_blob 2>&1 | tee -a $LOG_FILE

EXIT_CODE=$?

echo "" | tee -a $LOG_FILE

# Verify migrations are up to date
echo "Verifying migration status..." | tee -a $LOG_FILE
npx prisma migrate status 2>&1 | tee -a $LOG_FILE

echo "" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE
echo "Completed with exit code: $EXIT_CODE" | tee -a $LOG_FILE
echo "Ended at: $(date)" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE

exit $EXIT_CODE

