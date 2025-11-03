#!/bin/bash

LOG_FILE="migration-resolve.log"

echo "====================================" | tee -a $LOG_FILE
echo "Resolving Failed Migration" | tee -a $LOG_FILE
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

# Mark the failed migration as rolled back
echo "Step 1: Marking failed migration as rolled back..." | tee -a $LOG_FILE
npx prisma migrate resolve --rolled-back 20251030225052_add_asset_data_blob 2>&1 | tee -a $LOG_FILE

echo "" | tee -a $LOG_FILE
echo "Step 2: Deploying migrations..." | tee -a $LOG_FILE
npx prisma migrate deploy 2>&1 | tee -a $LOG_FILE

EXIT_CODE=$?

echo "" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE
echo "Migration resolution completed with exit code: $EXIT_CODE" | tee -a $LOG_FILE
echo "Ended at: $(date)" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE

exit $EXIT_CODE

