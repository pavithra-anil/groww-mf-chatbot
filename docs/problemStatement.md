# Problem Statement: Mutual Fund FAQ Assistant (Facts-Only Q&A)

## Overview
Build a lightweight FAQ assistant that answers factual questions about 
mutual fund schemes using Groww as the reference product context. 
The assistant must retrieve information exclusively from official public 
sources such as AMC websites, AMFI, and SEBI.

Every response must be factual, concise, and include one source link.
The assistant must never provide investment advice or recommendations.

## Target Users
- Retail investors comparing mutual fund schemes
- Customer support teams handling repetitive mutual fund queries

## Scope
- Pick one AMC and 3-5 schemes across different categories
- Collect 15-25 official public URLs as the knowledge base
- No PDFs for now

## What the Assistant Should Answer
- Expense ratio of a scheme
- Exit load details
- Minimum SIP amount
- ELSS lock-in period
- Riskometer classification
- Benchmark index
- How to download account statements or capital gains reports

## What the Assistant Must Refuse
- Investment advice ("Should I invest in this fund?")
- Fund comparisons involving opinion ("Which fund is better?")
- Any query involving personal financial data (PAN, Aadhaar, phone, email)
- Return predictions or performance comparisons

## Response Rules
- Maximum 3 sentences per answer
- Every answer must include one source link
- Refusals must be polite and include a relevant educational link

## UI Requirements
- Simple, minimal interface
- Welcome message
- 3 example questions visible to user
- Visible disclaimer: "Facts only. No investment advice."

## Constraints
- Public sources only — no third party blogs
- No personal data collection or storage
- No performance claims or return calculations
- Answers must be short, verifiable, and source-backed