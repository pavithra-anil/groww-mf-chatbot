import re

ADVICE_KEYWORDS = [
    "should i", "should i invest", "is it good", "is it worth",
    "better fund", "which fund", "best fund", "recommend",
    "best returns", "which is better", "should i buy",
    "should i sell", "should i switch", "portfolio advice",
    "where should i invest", "what should i do"
]

OUT_OF_SCOPE_KEYWORDS = [
    "what time", "what's the time", "weather", "temperature",
    "cricket", "sports", "movie", "recipe", "joke", "news",
    "stock price", "share price", "nifty", "sensex",
    "sbi fund", "axis fund", "icici fund", "kotak fund",
    "nippon fund", "mirae fund", "parag parikh", "uti fund",
    "aditya birla", "dsp fund", "franklin fund", "tata fund",
    "who is", "what is your name", "are you", "hello", "hi there",
    "translate", "write a", "code for", "explain me"
]

ADVICE_REFUSAL = (
    "I can only share factual information. "
    "For investment decisions, please consult a SEBI-registered financial advisor. "
    "Learn more: https://www.amfiindia.com/investor-corner/knowledge-center/mutual-funds-faqs.html"
)

PII_REFUSAL = (
    "I noticed your message may contain personal information. "
    "Please do not share PAN, Aadhaar, phone numbers, emails, or account numbers. "
    "I can only answer factual questions about mutual fund schemes."
)

OUT_OF_SCOPE_REFUSAL = (
    "I can only answer factual questions about HDFC Mutual Fund schemes listed on Groww — "
    "such as expense ratios, exit loads, minimum SIP amounts, lock-in periods, and fund managers. "
    "Your question appears to be outside that scope. Please try asking about an HDFC fund!"
)

def is_advice_query(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in ADVICE_KEYWORDS)

def is_out_of_scope(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in OUT_OF_SCOPE_KEYWORDS)

def is_pii(text: str) -> bool:
    pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
    aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
    phone_pattern = r'\b[6-9]\d{9}\b'
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    patterns = [pan_pattern, aadhaar_pattern, phone_pattern, email_pattern]
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    return False

def check_safety(query: str):
    if is_pii(query):
        return PII_REFUSAL
    if is_advice_query(query):
        return ADVICE_REFUSAL
    if is_out_of_scope(query):
        return OUT_OF_SCOPE_REFUSAL
    return None