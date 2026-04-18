import sys
import os

# Add project root to path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from runtime.phase_6_generation.generator import generate
from runtime.phase_7_safety.safety import check_safety
from runtime.phase_8_threads.session_manager import (
    create_session, add_message, get_history, session_exists
)

load_dotenv()

app = FastAPI(title="Groww MF FAQ Chatbot API")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    session_id: str
    query: str

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    source: str

class SessionResponse(BaseModel):
    session_id: str


@app.get("/health")
def health():
    """Check if API is running"""
    return {"status": "ok", "message": "Groww MF FAQ Chatbot is running!"}


@app.post("/session/new", response_model=SessionResponse)
def new_session():
    """Create a new independent chat session"""
    session_id = create_session()
    return {"session_id": session_id}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Main chat endpoint — takes query, returns factual answer"""

    # Validate session
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Create a new session first.")

    query = request.query.strip()

    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Step 1: Safety check
    safety_response = check_safety(query)
    if safety_response:
        add_message(request.session_id, "user", query)
        add_message(request.session_id, "assistant", safety_response)
        return {
            "session_id": request.session_id,
            "answer": safety_response,
            "source": "https://www.amfiindia.com/investor-corner/knowledge-center/mutual-funds-faqs.html"
        }

    # Step 2: Retrieve relevant chunks
    # Import here so retrieval stack is initialized only on first chat request.
    from runtime.phase_5_retrieval.retriever import retrieve
    chunks = retrieve(query, k=3)

    # Step 3: Generate answer
    answer = generate(query, chunks)

    # Step 4: Save to session history
    add_message(request.session_id, "user", query)
    add_message(request.session_id, "assistant", answer)

    # Extract source from top chunk
    source = chunks[0]["source_url"] if chunks else "https://groww.in/mutual-funds"

    return {
        "session_id": request.session_id,
        "answer": answer,
        "source": source
    }