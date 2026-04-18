import uuid
from datetime import datetime

# In-memory storage for all sessions
# Format: {session_id: {"history": [], "created_at": datetime}}
SESSIONS = {}

MAX_MESSAGES_PER_SESSION = 20

def create_session() -> str:
    """Create a new independent chat session. Returns session_id."""
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "history": [],
        "created_at": datetime.now().isoformat()
    }
    return session_id

def get_history(session_id: str) -> list:
    """Get message history for a session."""
    if session_id not in SESSIONS:
        return []
    return SESSIONS[session_id]["history"]

def add_message(session_id: str, role: str, content: str):
    """Add a message to session history. Role: 'user' or 'assistant'."""
    if session_id not in SESSIONS:
        return
    
    SESSIONS[session_id]["history"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat()
    })
    
    # Keep only last MAX_MESSAGES_PER_SESSION messages
    if len(SESSIONS[session_id]["history"]) > MAX_MESSAGES_PER_SESSION:
        SESSIONS[session_id]["history"] = SESSIONS[session_id]["history"][-MAX_MESSAGES_PER_SESSION:]

def clear_session(session_id: str):
    """Clear a session's history."""
    if session_id in SESSIONS:
        SESSIONS[session_id]["history"] = []

def session_exists(session_id: str) -> bool:
    """Check if a session exists."""
    return session_id in SESSIONS


# Quick test when run directly
if __name__ == "__main__":
    print("--- Session Manager Test ---\n")
    
    # Create two independent sessions
    session1 = create_session()
    session2 = create_session()
    
    print(f"Session 1 created: {session1}")
    print(f"Session 2 created: {session2}\n")
    
    # Add messages to session 1
    add_message(session1, "user", "What is the expense ratio of HDFC Mid Cap?")
    add_message(session1, "assistant", "The expense ratio is 0.77%. Source: groww.in")
    
    # Add different messages to session 2
    add_message(session2, "user", "What is the minimum SIP for HDFC ELSS?")
    add_message(session2, "assistant", "Minimum SIP is ₹100. Source: groww.in")
    
    # Verify sessions are independent
    print(f"Session 1 history ({len(get_history(session1))} messages):")
    for msg in get_history(session1):
        print(f"  {msg['role']}: {msg['content'][:60]}")
    
    print(f"\nSession 2 history ({len(get_history(session2))} messages):")
    for msg in get_history(session2):
        print(f"  {msg['role']}: {msg['content'][:60]}")
    
    print(f"\n✓ Sessions are fully independent — no shared memory!")