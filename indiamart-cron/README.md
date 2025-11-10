# IndiaMArt Lead Fetcher Cron Job

This directory contains a cron job setup to automatically fetch leads from IndiaMArt every 8 minutes.

## Files

- `fetch_leads.py` - Main Python script that fetches leads from IndiaMArt API
- `setup_cron.sh` - Shell script to set up the cron job
- `leads.log` - Log file for the application (created automatically)
- `cron.log` - Log file for cron job execution (created automatically)
- `last_fetch.txt` - Stores timestamp of last successful fetch (created automatically)
- `leads_YYYYMMDD_HHMMSS.json` - JSON files containing fetched leads (created automatically)

## Setup

1. **Set your IndiaMArt API key:**
   ```bash
   export INDIAMART_API_KEY="your_actual_api_key_here"
   ```

2. **Run the setup script:**
   ```bash
   ./setup_cron.sh
   ```

## Manual Testing

To test the script manually:
```bash
python3 fetch_leads.py
```

## Monitoring

- Check application logs: `tail -f leads.log`
- Check cron execution logs: `tail -f cron.log`
- View current crontab: `crontab -l`

## Removing the Cron Job

To remove the cron job:
```bash
crontab -e
# Delete the line containing 'fetch_leads.py'
```

## Notes

- The script fetches leads from the last successful fetch time to avoid duplicates
- Leads are displayed in the console and saved as JSON files
- All activities are logged for monitoring purposes
- The cron job runs every 8 minutes as specified