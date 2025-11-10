#!/usr/bin/env python3
import requests
import json
from datetime import datetime
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/media/soumit/New Volume/repos/sahyogi_transport/indiamart-cron/leads.log'),
        logging.StreamHandler()
    ]
)

class IndiaMArtLeadFetcher:
    def __init__(self):
        self.api_key = os.getenv('INDIAMART_API_KEY', 'your_api_key_here')
        self.base_url = 'https://mapi.indiamart.com/wservce/crm/crmListing/v2/'
        
    def fetch_leads(self):
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            params = {
                'glusr_crm_key': self.api_key,
                'start_time': self.get_last_fetch_time(),
                'end_time': datetime.now().strftime('%d-%b-%Y %H:%M:%S')
            }
            
            response = requests.get(self.base_url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                leads = data.get('RESPONSE', [])
                
                if leads:
                    self.display_leads(leads)
                    self.save_leads(leads)
                    logging.info(f"Fetched {len(leads)} new leads from IndiaMArt")
                else:
                    logging.info("No new leads found")
                    
                self.update_last_fetch_time()
                
            else:
                logging.error(f"API request failed with status code: {response.status_code}")
                
        except Exception as e:
            logging.error(f"Error fetching leads: {str(e)}")
    
    def display_leads(self, leads):
        print(f"\n{'='*60}")
        print(f"IndiaMArt Leads Fetched at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        for i, lead in enumerate(leads, 1):
            print(f"\nLead #{i}")
            print(f"Query ID: {lead.get('UNIQUE_QUERY_ID', 'N/A')}")
            print(f"Subject: {lead.get('SUBJECT', 'N/A')}")
            print(f"Sender Name: {lead.get('SENDERNAME', 'N/A')}")
            print(f"Sender Mobile: {lead.get('SENDERMOBILE', 'N/A')}")
            print(f"Sender Email: {lead.get('SENDEREMAIL', 'N/A')}")
            print(f"Query Message: {lead.get('QUERY_MESSAGE', 'N/A')}")
            print(f"Date Time: {lead.get('DATE_TIME', 'N/A')}")
            print(f"Product Name: {lead.get('QUERY_PRODUCT_NAME', 'N/A')}")
            print(f"City: {lead.get('SENDERCITY', 'N/A')}")
            print(f"State: {lead.get('SENDERSTATE', 'N/A')}")
            print("-" * 40)
    
    def save_leads(self, leads):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'/media/soumit/New Volume/repos/sahyogi_transport/indiamart-cron/leads_{timestamp}.json'
        
        with open(filename, 'w') as f:
            json.dump(leads, f, indent=2)
            
        logging.info(f"Leads saved to {filename}")
    
    def get_last_fetch_time(self):
        timestamp_file = '/media/soumit/New Volume/repos/sahyogi_transport/indiamart-cron/last_fetch.txt'
        
        if os.path.exists(timestamp_file):
            with open(timestamp_file, 'r') as f:
                return f.read().strip()
        else:
            from datetime import timedelta
            eight_minutes_ago = datetime.now() - timedelta(minutes=8)
            return eight_minutes_ago.strftime('%d-%b-%Y %H:%M:%S')
    
    def update_last_fetch_time(self):
        timestamp_file = '/media/soumit/New Volume/repos/sahyogi_transport/indiamart-cron/last_fetch.txt'
        
        with open(timestamp_file, 'w') as f:
            f.write(datetime.now().strftime('%d-%b-%Y %H:%M:%S'))

if __name__ == "__main__":
    fetcher = IndiaMArtLeadFetcher()
    fetcher.fetch_leads()