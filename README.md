# Groww MF Assistant — RAG-based Mutual Fund FAQ Chatbot

## Overview
A facts-only FAQ assistant for HDFC Mutual Fund schemes listed on Groww.
Built using Retrieval-Augmented Generation (RAG) to answer factual questions
about mutual fund schemes from official public sources only.

No investment advice. Every answer includes one source citation.

## Live Demo
🔗 https://groww-mf-chatbot.vercel.app

## AMC and Schemes in Scope
- **AMC:** HDFC Mutual Fund
- **Schemes:**
  - HDFC Mid Cap Fund
  - HDFC Equity Fund
  - HDFC Focused Fund
  - HDFC ELSS Tax Saver Fund
  - HDFC Large Cap Fund

## Architecture Overview

### RAG Pipeline (runs daily at 9:15 AM IST via GitHub Actions)
Phase 4.0 — Scraper      → Fetches 5 Groww URLs, saves HTML to data/raw/
Phase 4.1 — Chunker      → Extracts text, splits into 500-char chunks
Phase 4.2 — Embedder     → Converts chunks to vectors (all-MiniLM-L6-v2)
Phase 4.3 — Vector Store → Stores 2,270 chunks in local ChromaDB

### Runtime (serves user queries)
Phase 5 — Retriever      → Embeds query, searches ChromaDB (top 3 chunks)
Phase 6 — Generator      → Sends context to Groq LLM, generates answer
Phase 7 — Safety Filter  → Blocks PII, refuses advisory queries
Phase 8 — Session Mgr    → Manages independent chat sessions
Phase 9 — FastAPI        → REST API backend

### Frontend
- Next.js app hosted on Vercel
- Groww-themed UI with floating chat widget
- Clickable fund cards that pre-fill questions

## Tech Stack
| Component | Tool |
|-----------|------|
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | ChromaDB (local) |
| LLM | Groq llama-3.1-8b-instant |
| Backend | FastAPI on Render |
| Frontend | Next.js on Vercel |
| Scheduler | GitHub Actions |

## Setup Steps

### Prerequisites
- Python 3.11
- Node.js 18+
- Groq API key (free at console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/pavithra-anil/groww-mf-chatbot.git
cd groww-mf-chatbot
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up environment variables
Create a `.env` file in the root:
GROQ_API_KEY=your_groq_key_here

### 4. Run the ingestion pipeline
```bash
python ingest/scraper.py
python ingest/pdf_parser.py
python ingest/embedder.py
python ingest/vector_store.py
```

### 5. Start the backend
```bash
python -m uvicorn runtime.phase_9_api.main:app --reload
```

### 6. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

### 7. Open the app
http://localhost:3000

## Known Limitations
- Only covers 5 HDFC Mutual Fund schemes listed on Groww
- Groww pages use JavaScript rendering — some real-time data (live NAV) may not be captured
- ChromaDB is local — not horizontally scalable
- Sources refreshed once daily — not real-time
- No PDF upload support
- Render free tier has cold start delay (~60 seconds after inactivity)

## Disclaimer
Facts only. No investment advice. Always consult a SEBI-registered financial
advisor before investing. Last updated from sources: April 2025.

## Project Structure
groww-mf-chatbot/
├── data/
│   ├── raw/          ← scraped HTML files
│   ├── chunked/      ← text chunks JSON
│   ├── normalized/   ← embeddings JSON
│   ├── chroma/       ← ChromaDB vector index
│   └── pdfs/         ← HDFC factsheets and KIM documents
├── docs/             ← architecture and problem statement
├── ingest/           ← data pipeline scripts
├── runtime/          ← retrieval, generation, safety, API
├── frontend/         ← Next.js UI
├── .env              ← API keys (not committed)
└── requirements.txt

## Built For
NextLeap PM Fellowship — Learn in Public Challenge (LIP/2)