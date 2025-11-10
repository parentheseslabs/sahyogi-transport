#!/bin/bash

SCRIPT_DIR="/media/soumit/New Volume/repos/sahyogi_transport/indiamart-cron"
PYTHON_SCRIPT="$SCRIPT_DIR/fetch_leads.py"

echo "Setting up IndiaMArt lead fetcher cron job..."

(crontab -l 2>/dev/null; echo "*/8 * * * * /usr/bin/python3 \"$PYTHON_SCRIPT\" >> \"$SCRIPT_DIR/cron.log\" 2>&1") | crontab -

echo "Cron job has been set up to run every 8 minutes."
echo "The job will execute: $PYTHON_SCRIPT"
echo "Logs will be written to: $SCRIPT_DIR/cron.log"

echo ""
echo "Current crontab:"
crontab -l

echo ""
echo "To remove the cron job later, run:"
echo "crontab -e"
echo "and delete the line containing 'fetch_leads.py'"