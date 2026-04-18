import re

# Advisory intent keywords
ADVICE_KEYWORDS = [
    "should i", "should i invest", "is it good", "is it worth",
    "better fund", "which fund", "best fund", "recommend",
    "best returns", "which is better", "should i buy",
    "should i sell", "should i switch", "portfolio advice",
    "where should i invest", "what should i do"
]

# Refusal message for advice queries
ADVICE_REFUSAL = (
    "I can only share factual information. "
    "For investment decisions, please consult a SEBI-registered financial advisor. "
    "Learn more: https://www.amfiindia.com/investor-corner/knowledge-center/mutual-funds-faqs.html"
)

# PII refusal message
PII_REFUSAL = (
    "I noticed your message may contain personal information. "
    "Please do not share PAN, Aadhaar, phone numbers, emails, or account numbers. "
    "I can only answer factual questions about mutual fund schemes."
)

def is_advice_query(text: str) -> bool:
    """Check if the query is asking for investment advice"""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in ADVICE_KEYWORDS)

def is_pii(text: str) -> bool:
    """Check if the text contains personal identifiable information"""
    
    # PAN number pattern (e.g., ABCDE1234F)
    pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
    
    # Aadhaar number pattern (12 digits, may have spaces)
    aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
    
    # Indian phone number (10 digits starting with 6-9)
    phone_pattern = r'\b[6-9]\d{9}\b'
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    patterns = [pan_pattern, aadhaar_pattern, phone_pattern, email_pattern]
    
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    
    return False

def check_safety(query: str):
    """
    Main safety check function.
    Returns refusal message string if unsafe, None if safe to proceed.
    """
    if is_pii(query):
        return PII_REFUSAL
    
    if is_advice_query(query):
        return ADVICE_REFUSAL
    
    return None  # Safe to proceed


# Quick test when run directly
if __name__ == "__main__":
    test_queries = [
        "What is the expense ratio of HDFC Mid Cap Fund?",  # Safe
        "Should I invest in HDFC ELSS?",                    # Advice
        "Which fund is better for me?",                     # Advice
        "My PAN is ABCDE1234F, help me",                   # PII
        "What is the minimum SIP for HDFC Large Cap?",     # Safe
        "My phone is 9876543210",                           # PII
    ]

    print("--- Safety Filter Test ---\n")
    for query in test_queries:
        result = check_safety(query)
        if result:
            print(f"Query: {query}")
            print(f"  ✗ BLOCKED: {result[:80]}...\n")
        else:
            print(f"Query: {query}")
            print(f"  ✓ SAFE — proceed to retriever\n")