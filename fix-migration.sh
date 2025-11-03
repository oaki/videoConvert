#!/bin/bash

LOG_FILE="migration-fix.log"

echo "====================================" | tee -a $LOG_FILE
echo "Database Migration Fix Script" | tee -a $LOG_FILE
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

# Run the migration
echo "Running: npx prisma migrate deploy" | tee -a $LOG_FILE
npx prisma migrate deploy 2>&1 | tee -a $LOG_FILE

EXIT_CODE=$?

echo "" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE
echo "Migration completed with exit code: $EXIT_CODE" | tee -a $LOG_FILE
echo "Ended at: $(date)" | tee -a $LOG_FILE
echo "====================================" | tee -a $LOG_FILE

exit $EXIT_CODE

