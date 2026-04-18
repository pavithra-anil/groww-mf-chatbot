# RAG Architecture: Mutual Fund FAQ Assistant

## Overview
A Retrieval-Augmented Generation (RAG) system that answers factual questions
about HDFC Mutual Fund schemes listed on Groww. Built with free, open-source
tools. No investment advice. Every answer cites one official source.

## AMC & Schemes in Scope
- **AMC:** HDFC Mutual Fund
- **Schemes:**
  - HDFC Mid Cap Fund
  - HDFC Equity Fund
  - HDFC Focused Fund
  - HDFC ELSS Tax Saver Fund
  - HDFC Large Cap Fund

## Source URLs
- https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth
- https://groww.in/mutual-funds/hdfc-equity-fund-direct-growth
- https://groww.in/mutual-funds/hdfc-focused-fund-direct-growth
- https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth
- https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth

## Pipeline Overview

[ GitHub Actions Scheduler — 9:15 AM IST daily ]
                    |
                    v
         [ Phase 4.0: Scraper ]
         Fetch 5 Groww URLs
         Save raw HTML → data/raw/
                    |
                    v
         [ Phase 4.1: Chunker ]
         Extract visible text
         Split into 500-char chunks
         Attach metadata (source_url, date)
         Save → data/chunked/
                    |
                    v
         [ Phase 4.2: Embedder ]
         Load sentence-transformers/all-MiniLM-L6-v2 locally
         Convert chunks to vectors
         Save → data/normalized/
                    |
                    v
         [ Phase 4.3: Vector Store ]
         Store in local ChromaDB
         Collection: mf_faq
         Persist → data/chroma/
                    |
                    v
         [ GitHub Actions Artifact ]
         Upload data/chroma/ as artifact
                    |
                    v
[ User Query via Next.js Frontend ]
                    |
                    v
         [ Phase 5: Retriever ]
         Embed query with bge-small
         Search ChromaDB → top 3 chunks
                    |
                    v
         [ Phase 6: Generator ]
         Send query + chunks to Groq
         Model: llama3-8b-8192 (free)
         Facts-only, 3 sentences, cite source
                    |
                    v
         [ Phase 7: Safety Filter ]
         Block PII detection
         Refuse advisory queries
                    |
                    v
         [ Phase 8: Session Manager ]
         Independent sessions via uuid4
         No memory shared between sessions
                    |
                    v
         [ Phase 9: FastAPI Backend ]
         POST /chat
         POST /session/new
         GET /health
                    |
                    v
         [ Next.js Frontend — Vercel ]
         Dark theme UI
         Chat window + session sidebar
         Welcome banner + disclaimer