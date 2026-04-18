import os
import json
from datetime import datetime

FILE_NAMES_MAP = {
    "factsheet": "hdfc_factsheet",
    "large": "hdfc_large_cap_kim",
    "elss": "hdfc_elss_kim",
    "mid": "hdfc_mid_cap_kim",
}

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using pypdf"""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
        return text.strip()
    except Exception as e:
        print(f"  Error reading {pdf_path}: {e}")
        return ""

def split_into_chunks(text: str, source_name: str, pdf_path: str):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_text = text[start:end].strip()

        if len(chunk_text) > 50:
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "source_url": f"https://www.hdfcfund.com/mutual-funds/fund-documents/kim",
                    "file_name": source_name,
                    "chunk_index": chunk_index,
                    "scraped_date": datetime.now().strftime("%Y-%m-%d"),
                    "source_type": "pdf",
                    "pdf_file": os.path.basename(pdf_path),
                }
            })
            chunk_index += 1

        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks

def parse_all_pdfs():
    pdf_dir = "data/pdfs"
    output_dir = "data/chunked"
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(pdf_dir):
        print(f"PDF folder not found: {pdf_dir}")
        return

    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]

    if not pdf_files:
        print("No PDF files found in data/pdfs/")
        return

    print(f"\n--- PDF Parser started at {datetime.now()} ---\n")
    total_chunks = 0

    for pdf_file in pdf_files:
        pdf_path = os.path.join(pdf_dir, pdf_file)

        # Determine friendly name
        pdf_lower = pdf_file.lower()
        source_name = "hdfc_pdf"
        for key, name in FILE_NAMES_MAP.items():
            if key in pdf_lower:
                source_name = name
                break

        print(f"Processing: {pdf_file}")
        text = extract_text_from_pdf(pdf_path)

        if not text:
            print(f"  ✗ No text extracted\n")
            continue

        print(f"  Raw text: {len(text)} chars")
        chunks = split_into_chunks(text, source_name, pdf_path)

        # Save chunks
        output_path = os.path.join(output_dir, f"{source_name}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chunks, f, indent=2, ensure_ascii=False)

        print(f"  ✓ {len(chunks)} chunks saved → {output_path}\n")
        total_chunks += len(chunks)

    print(f"--- Done. {total_chunks} total PDF chunks created ---\n")

if __name__ == "__main__":
    parse_all_pdfs()