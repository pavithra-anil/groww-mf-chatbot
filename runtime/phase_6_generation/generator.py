import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.1-8b-instant"

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a facts-only mutual fund FAQ assistant for Groww users, focused on HDFC Mutual Fund schemes.

Your rules:
1. Answer ONLY factual questions about: expense ratio, exit load, minimum SIP, lock-in period, riskometer, benchmark index, or how to download statements.
2. Keep answers to a maximum of 3 short sentences.
3. If listing multiple items, use a new line for each item starting with a dash (-).
4. Always end your answer with a new line and: "Source: <url>" using the most relevant URL from the context.
5. Always end with another new line and: "Last updated from sources: April 2025"
6. If the user asks for investment advice, portfolio recommendations, return predictions, or fund comparisons involving opinion, respond with exactly:
   "I can only share factual information. For investment decisions, please consult a SEBI-registered financial advisor. Learn more: https://www.amfiindia.com/investor-corner/knowledge-center/mutual-funds-faqs.html"
7. Never acknowledge PAN, Aadhaar, phone, or account numbers.
8. Never make up information. Only use what is in the provided context."""

def generate(query: str, context_chunks: list) -> str:
    """
    Generate a factual answer using Groq LLM.
    query: user's question
    context_chunks: list of {text, source_url, score} from retriever
    """
    if not context_chunks:
        return "I could not find relevant information to answer your question. Please try rephrasing or visit https://groww.in/mutual-funds for more details."

    # Build context string from retrieved chunks
    context = ""
    for i, chunk in enumerate(context_chunks, 1):
        context += f"\nContext {i} (Source: {chunk['source_url']}):\n{chunk['text']}\n"

    # Build user message
    user_message = f"""Answer this question using only the context below.

Question: {query}

{context}

Remember: Max 3 sentences. End with Source: <url> and Last updated from sources: April 2025."""

    # Call Groq API
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.1,  # Low temperature = more factual, less creative
        max_tokens=300
    )

    return response.choices[0].message.content


# Quick test when run directly
if __name__ == "__main__":
    # Simulate what retriever would return
    test_chunks = [
        {
            "text": "HDFC Mid Cap Opportunities Fund has an expense ratio of 0.77% for direct plan. Minimum SIP Investment is set to ₹100. Exit load of 1% if redeemed within 1 year.",
            "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            "score": 0.85
        }
    ]

    test_query = "What is the expense ratio of HDFC Mid Cap Fund?"
    print(f"Query: {test_query}\n")
    
    answer = generate(test_query, test_chunks)
    print(f"Answer:\n{answer}\n")

    # Test refusal
    advice_query = "Should I invest in HDFC Mid Cap Fund?"
    print(f"Query: {advice_query}\n")
    
    answer2 = generate(advice_query, test_chunks)
    print(f"Answer:\n{answer2}\n")