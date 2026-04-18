const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function createSession(): Promise<string> {
  const res = await fetch(`${API_URL}/session/new`, { method: "POST" });
  if (!res.ok) throw new Error(`session/new failed: ${res.status}`);
  const data = await res.json();
  if (typeof data.session_id !== "string") throw new Error("session/new: missing session_id");
  return data.session_id;
}

/** Ensures a backend session exists before calling /chat (POST /session/new when id is missing). */
export async function prepareSession(sessionId?: string | null): Promise<string> {
  if (sessionId && sessionId.trim().length > 0) return sessionId;
  return createSession();
}

export async function sendMessage(session_id: string, query: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, query }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `chat failed: ${res.status}`);
  }
  return res.json();
}
