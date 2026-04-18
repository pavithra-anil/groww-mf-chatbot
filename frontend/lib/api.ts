const LOCAL_DEFAULT = "http://127.0.0.1:8000";
/** Public Render URL (HTTPS). Used when NEXT_PUBLIC_API_URL is missing in the Vercel build. */
const DEFAULT_PRODUCTION_API = "https://groww-mf-chatbot.onrender.com";

function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (typeof window === "undefined") return trimmed;
  // Avoid mixed-content blocking: HTTPS page cannot call HTTP API on another host.
  if (window.location.protocol === "https:" && trimmed.startsWith("http://")) {
    try {
      const u = new URL(trimmed);
      if (u.hostname.endsWith("onrender.com") || u.hostname.endsWith("render.com")) {
        return `https://${u.host}`;
      }
    } catch {
      /* ignore */
    }
  }
  return trimmed;
}

export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) return normalizeApiUrl(env);
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return DEFAULT_PRODUCTION_API;
  }
  return LOCAL_DEFAULT;
}

export async function createSession(): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}/session/new`, { method: "POST" });
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

const CHAT_TIMEOUT_MS = 120_000;

export async function sendMessage(session_id: string, query: string) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, query }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `chat failed: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Request timed out. The server may be waking up (Render free tier) or overloaded — try again in a minute."
      );
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
