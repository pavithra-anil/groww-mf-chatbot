import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

SOURCE_URLS = [
    # Groww pages
    "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-equity-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-focused-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth",
    "https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth",
    # AMFI working pages
    "https://www.amfiindia.com/investor-corner/knowledge-center/mutual-funds-faqs.html",
    "https://www.amfiindia.com/investor-corner/knowledge-center/elss.html",
    "https://www.amfiindia.com/investor-corner/knowledge-center/how-to-invest-in-mutual-funds.html",
    "https://www.amfiindia.com/investor-corner/knowledge-center/what-is-sip.html",
    # SEBI
    "https://www.sebi.gov.in/investor/mutual-fund.html",
]

FILE_NAMES = [
    "groww_mid_cap",
    "groww_equity",
    "groww_focused",
    "groww_elss",
    "groww_large_cap",
    "amfi_mf_faqs",
    "amfi_elss",
    "amfi_how_to_invest",
    "amfi_sip",
    "sebi_mf",
]

# Pretend to be a browser so websites don't block us
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def scrape_all():
    # Create data/raw/ folder if it doesn't exist
    os.makedirs("data/raw", exist_ok=True)
    
    print(f"\n--- Scraper started at {datetime.now()} ---\n")
    
    success = 0
    failed = 0
    
    for url, name in zip(SOURCE_URLS, FILE_NAMES):
        try:
            print(f"Fetching: {url}")
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()
            
            # Save the raw HTML to data/raw/
            output_path = f"data/raw/{name}.html"
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(response.text)
            
            print(f"  ✓ Saved → {output_path} ({len(response.text)} chars)\n")
            success += 1

        except Exception as e:
            print(f"  ✗ FAILED: {url}")
            print(f"  Reason: {e}\n")
            failed += 1
    
    print(f"--- Done. {success} succeeded, {failed} failed ---\n")

if __name__ == "__main__":
    scrape_all()