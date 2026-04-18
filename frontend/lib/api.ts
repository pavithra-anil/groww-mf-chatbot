const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function createSession(): Promise<string> {
  const res = await fetch(`${API_URL}/session/new`, { method: "POST" });
  const data = await res.json();
  return data.session_id;
}

export async function sendMessage(session_id: string, query: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, query }),
  });
  return await res.json();
}