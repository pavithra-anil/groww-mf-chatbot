import os
import json
from bs4 import BeautifulSoup
from datetime import datetime

# Same URLs and names as scraper - needed for metadata
SOURCE_URLS = [
    "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-equity-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-focused-fund-direct-growth",
    "https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth",
    "https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth",
]

FILE_NAMES = [
    "hdfc_mid_cap",
    "hdfc_equity",
    "hdfc_focused",
    "hdfc_elss",
    "hdfc_large_cap",
]

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

def extract_text(html_content):
    """Extract only visible readable text from HTML"""
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Remove tags that don't contain useful text
    for tag in soup(["script", "style", "nav", "footer", "header", "meta"]):
        tag.decompose()
    
    # Get clean text
    text = soup.get_text(separator=" ")
    
    # Clean up extra whitespace
    lines = [line.strip() for line in text.splitlines()]
    text = " ".join(line for line in lines if line)
    
    return text

def split_into_chunks(text, source_url, file_name):
    """Split text into overlapping chunks with metadata"""
    chunks = []
    start = 0
    chunk_index = 0
    
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_text = text[start:end]
        
        # Only save chunks with meaningful content
        if len(chunk_text.strip()) > 50:
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "source_url": source_url,
                    "file_name": file_name,
                    "chunk_index": chunk_index,
                    "scraped_date": datetime.now().strftime("%Y-%m-%d")
                }
            })
            chunk_index += 1
        
        # Move forward with overlap
        start += CHUNK_SIZE - CHUNK_OVERLAP
    
    return chunks

def chunk_all():
    os.makedirs("data/chunked", exist_ok=True)
    
    print(f"\n--- Chunker started at {datetime.now()} ---\n")
    
    total_chunks = 0
    
    for url, name in zip(SOURCE_URLS, FILE_NAMES):
        input_path = f"data/raw/{name}.html"
        output_path = f"data/chunked/{name}.json"
        
        if not os.path.exists(input_path):
            print(f"  ✗ File not found: {input_path} — run scraper first!\n")
            continue
        
        # Read HTML file
        with open(input_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        
        # Extract clean text
        text = extract_text(html_content)
        print(f"Processing: {name}")
        print(f"  Raw text length: {len(text)} chars")
        
        # Split into chunks
        chunks = split_into_chunks(text, url, name)
        
        # Save chunks as JSON
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chunks, f, indent=2, ensure_ascii=False)
        
        print(f"  ✓ {len(chunks)} chunks saved → {output_path}\n")
        total_chunks += len(chunks)
    
    print(f"--- Done. {total_chunks} total chunks created ---\n")

if __name__ == "__main__":
    chunk_all()