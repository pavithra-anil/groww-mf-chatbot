"use client";

import { useState, useEffect, useRef } from "react";
import { createSession, prepareSession, sendMessage } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

const FUNDS = [
  {
    name: "HDFC Mid Cap Fund",
    category: "Mid Cap · Equity",
    description: "Invests in mid-sized companies with high growth potential, balancing risk and returns over the long term.",
    icon: "📈",
    color: "#E8F5E9",
    tags: ["Factsheet", "KIM", "Groww Page"],
    question: "What is the expense ratio of HDFC Mid Cap Fund?",
  },
  {
    name: "HDFC Equity Fund",
    category: "Flexi Cap · Equity",
    description: "Dynamically allocates across large, mid and small cap segments based on market opportunities.",
    icon: "⚖️",
    color: "#E3F2FD",
    tags: ["Factsheet", "KIM", "Groww Page"],
    question: "What is the exit load for HDFC Equity Fund?",
  },
  {
    name: "HDFC Focused Fund",
    category: "Focused · Equity",
    description: "Concentrated portfolio of up to 30 high-conviction stocks across market capitalizations.",
    icon: "🎯",
    color: "#FFF3E0",
    tags: ["Factsheet", "KIM", "Groww Page"],
    question: "What is the minimum SIP for HDFC Focused Fund?",
  },
  {
    name: "HDFC ELSS Tax Saver",
    category: "ELSS · Tax Saving",
    description: "Equity-linked savings scheme with 3-year lock-in. Eligible for tax deduction under Section 80C.",
    icon: "🔒",
    color: "#F3E5F5",
    tags: ["Factsheet", "KIM", "Groww Page"],
    question: "What is the lock-in period for HDFC ELSS Tax Saver?",
  },
  {
    name: "HDFC Large Cap Fund",
    category: "Large Cap · Equity",
    description: "Invests predominantly in top 100 companies by market cap for stable long-term capital appreciation.",
    icon: "🏛",
    color: "#E8EAF6",
    tags: ["Factsheet", "KIM", "Groww Page"],
    question: "What is the riskometer of HDFC Large Cap Fund?",
  },
];

const EXAMPLE_QUESTIONS = [
  "What is the expense ratio of HDFC Mid Cap Fund?",
  "What is the exit load for HDFC ELSS Tax Saver?",
  "What is the minimum SIP for HDFC Large Cap Fund?",
];

// Custom SVG logo component
function GrowwLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect width="32" height="32" rx="8" fill="#00D09C"/>
        <circle cx="12" cy="16" r="6" fill="white" fillOpacity="0.25"/>
        <circle cx="20" cy="16" r="6" fill="white" fillOpacity="0.5"/>
        <text x="16" y="20" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">G</text>
      </svg>
    </div>
  );
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [chatOpen, activeSessionId]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  async function handleNewChat() {
    try {
      const id = await createSession();
      const session: Session = { id, title: "New chat", messages: [] };
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(id);
      setShowSessions(false);
    } catch {
      alert("Could not connect to backend. Make sure the API is running.");
    }
  }

  async function openChatWithQuestion(question: string) {
    setChatOpen(true);
    await sendQuery(question, activeSessionId);
  }

  async function sendQuery(
    query: string,
    sid: string | null,
    opts?: { afterSessionReady?: () => void }
  ) {
    if (!query || loading) return;

    let session_id: string;
    try {
      session_id = await prepareSession(sid);
    } catch {
      alert("Could not connect to backend. Make sure the API is running.");
      return;
    }

    opts?.afterSessionReady?.();

    if (!sid) setActiveSessionId(session_id);

    setSessions((prev) => {
      let list = prev;
      if (!list.some((s) => s.id === session_id)) {
        list = [{ id: session_id, title: query.slice(0, 35), messages: [] }, ...prev];
      }
      return list.map((s) =>
        s.id === session_id
          ? {
              ...s,
              title: s.messages.length === 0 ? query.slice(0, 35) : s.title,
              messages: [...s.messages, { role: "user" as const, content: query }],
            }
          : s
      );
    });

    setLoading(true);
    try {
      const data = await sendMessage(session_id, query);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session_id
            ? { ...s, messages: [...s.messages, { role: "assistant" as const, content: data.answer, source: data.source }] }
            : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session_id
            ? { ...s, messages: [...s.messages, { role: "assistant" as const, content: "Could not get a response. Make sure the backend is running." }] }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text?: string) {
    const query = text || input.trim();
    if (!query || loading) return;
    await sendQuery(query, activeSessionId, {
      afterSessionReady: () => setInput(""),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: "#1a1a2e", background: "#fff" }}>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", padding: "0 40px", height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GrowwLogo size={32} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Groww MF Assistant</span>
        </div>
        <div style={{ display: "flex", gap: 32, marginLeft: 48 }}>
          <span onClick={() => openChatWithQuestion("What are the HDFC mutual funds available on Groww?")}
            style={{ fontSize: 13, color: "#666", cursor: "pointer", fontWeight: 500 }}>Mutual Funds</span>
          <span onClick={() => scrollTo("schemes")}
            style={{ fontSize: 13, color: "#666", cursor: "pointer", fontWeight: 500 }}>Schemes</span>
          <span onClick={() => scrollTo("faqs")}
            style={{ fontSize: 13, color: "#666", cursor: "pointer", fontWeight: 500 }}>FAQs</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "#00A87A", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D09C", display: "inline-block" }}></span>
            Live - Updated daily at 9:15 AM
          </span>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        textAlign: "center", padding: "80px 40px 64px",
        background: "linear-gradient(180deg, #f0fdf8 0%, #fff 100%)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff", border: "1px solid #00D09C",
          color: "#00A87A", padding: "5px 14px", borderRadius: 999,
          fontSize: 12, fontWeight: 500, marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D09C", display: "inline-block" }}></span>
          Powered by RAG, Official sources only
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.15 }}>Ask anything about</h1>
        <h1 style={{ fontSize: 52, fontWeight: 800, margin: "0 0 20px", lineHeight: 1.15, color: "#00D09C" }}>mutual funds on Groww</h1>
        <p style={{ fontSize: 17, color: "#666", margin: "0 auto 12px", maxWidth: 520, lineHeight: 1.7 }}>
          Get instant, cited answers from official HDFC factsheets, KIM documents and Groww scheme pages.
        </p>
        <p style={{ fontSize: 14, color: "#999", margin: "0 auto 40px", maxWidth: 480 }}>
          Currently covering HDFC Mutual Fund schemes. Facts only, no advice.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 64 }}>
          <button
            onClick={() => { setChatOpen(true); if (!activeSessionId) handleNewChat(); }}
            style={{
              background: "#00D09C", color: "#fff", border: "none",
              padding: "14px 28px", borderRadius: 10, fontSize: 15,
              fontWeight: 600, cursor: "pointer",
            }}
          >Start asking</button>
          <button onClick={() => scrollTo("schemes")} style={{
            background: "#fff", color: "#1a1a2e", border: "1px solid #e0e0e0",
            padding: "14px 28px", borderRadius: 10, fontSize: 15,
            fontWeight: 600, cursor: "pointer",
          }}>View schemes</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 64 }}>
          {[{ value: "5", label: "HDFC Schemes" }, { value: "2,270", label: "Knowledge chunks" }, { value: "9", label: "Official sources" }].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <div style={{
        background: "#1a1a2e", padding: "16px 40px",
        display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap",
      }}>
        {["🛡 No investment advice", "🔗 Every answer cited", "🕘 Updated daily at 9:15 AM", "📄 Official sources only", "🔒 No personal info collected"].map((t, i) => (
          <span key={i} style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>{t}</span>
        ))}
      </div>

      {/* EXAMPLE QUESTIONS */}
      <section id="faqs" style={{ padding: "56px 40px", textAlign: "center", background: "#fafafa" }}>
        <p style={{ fontSize: 13, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 20 }}>Try asking</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => openChatWithQuestion(q)} style={{
              background: "#fff", border: "1px solid #e0e0e0", color: "#333",
              padding: "12px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",
              fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#00D09C"; e.currentTarget.style.color = "#00A87A"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#333"; }}
            >{q}</button>
          ))}
        </div>
      </section>

      {/* FUND CARDS */}
      <section id="schemes" style={{ padding: "64px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 13, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 10 }}>Schemes covered</p>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>5 HDFC Mutual Fund Schemes</h2>
          <p style={{ fontSize: 15, color: "#666", marginTop: 10 }}>Click any fund to ask a question about it</p>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, maxWidth: 1100, margin: "0 auto",
        }}>
          {FUNDS.map((fund, i) => (
            <div key={i}
              onClick={() => openChatWithQuestion(fund.question)}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: "#fff",
                border: hoveredCard === i ? "1.5px solid #00D09C" : "1px solid #f0f0f0",
                borderRadius: 16, padding: "24px", cursor: "pointer",
                boxShadow: hoveredCard === i ? "0 8px 32px rgba(0,208,156,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
                transform: hoveredCard === i ? "translateY(-3px)" : "translateY(0)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: fund.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{fund.icon}</div>
                <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{fund.category}</div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#1a1a2e" }}>{fund.name}</h3>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 16px" }}>{fund.description}</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {fund.tags.map((tag, j) => (
                  <span key={j} style={{
                    fontSize: 11, color: "#888", background: "#f5f5f5",
                    padding: "3px 10px", borderRadius: 999, fontWeight: 500,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hoveredCard === i ? "#00A87A" : "#aaa", transition: "color 0.2s" }}>
                Ask about this fund →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "64px 40px", background: "#fafafa", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 10 }}>How it works</p>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 48px" }}>RAG-powered factual answers</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", maxWidth: 900, margin: "0 auto" }}>
          {[
            { step: "01", title: "You ask a question", desc: "Type any factual question about HDFC mutual fund schemes on Groww", icon: "💬" },
            { step: "02", title: "We search the docs", desc: "RAG retrieves relevant chunks from 2,270 indexed pieces", icon: "🔍" },
            { step: "03", title: "AI generates answer", desc: "Groq LLM forms a concise, cited answer in under 3 sentences", icon: "⚡" },
            { step: "04", title: "You get the source", desc: "Every answer includes a link to the official source document", icon: "🔗" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid #f0f0f0",
              borderRadius: 14, padding: "24px 20px", width: 180,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "#00A87A", fontWeight: 700, marginBottom: 8 }}>STEP {item.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a2e", padding: "40px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <GrowwLogo size={28} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Groww MF Assistant</span>
        </div>
        <p style={{ fontSize: 12, color: "#666", maxWidth: 560, margin: "0 auto 16px", lineHeight: 1.7 }}>
          This chatbot provides factual information only from official HDFC Mutual Fund sources and Groww scheme pages. It does not provide investment advice, recommendations, or performance comparisons. For investment guidance, consult a SEBI-registered financial advisor.
        </p>
        <p style={{ fontSize: 11, color: "#444" }}>Last updated from sources: April 2025 · Built for NextLeap LIP Challenge · Currently covering HDFC schemes on Groww</p>
      </footer>

      {/* FLOATING BUBBLE */}
      {!chatOpen && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000 }}>
          {showGreeting && (
            <div style={{
              position: "absolute", bottom: 68, right: 0,
              background: "#1a1a2e", color: "#fff",
              padding: "12px 16px", borderRadius: "12px 12px 2px 12px",
              fontSize: 13, fontWeight: 500,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              width: 220, lineHeight: 1.6,
            }}>
              👋 Hey! I&apos;m your Groww MF Assistant
              <br />
              <span style={{ fontSize: 11, color: "#aaa" }}>Ask about HDFC funds listed on Groww</span>
            </div>
          )}
          <button
            onClick={async () => {
              setChatOpen(true);
              setShowGreeting(false);
              if (!activeSessionId) await handleNewChat();
            }}
            onMouseEnter={() => setShowGreeting(true)}
            onMouseLeave={() => setShowGreeting(false)}
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#00D09C", border: "none", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,208,156,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#fff", transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >💬</button>
        </div>
      )}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={{
          position: "fixed", bottom: 0, right: 0, zIndex: 1000,
          width: 380, height: "85vh", maxHeight: 640,
          background: "#fff", borderRadius: "16px 16px 0 0",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column",
          border: "1px solid #f0f0f0",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #f0f0f0",
            display: "flex", alignItems: "center", gap: 10,
            borderRadius: "16px 16px 0 0",
          }}>
            <GrowwLogo size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Groww MF Assistant</div>
              <div style={{ fontSize: 11, color: "#00A87A", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D09C", display: "inline-block" }}></span>
                Online
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowSessions(!showSessions)} style={{
                background: "#f5f5f5", border: "none", width: 30, height: 30,
                borderRadius: 8, cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>≡</button>
              <button onClick={handleNewChat} style={{
                background: "#00D09C", border: "none", width: 30, height: 30,
                borderRadius: 8, cursor: "pointer", color: "#fff", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              }}>+</button>
              <button onClick={() => setChatOpen(false)} style={{
                background: "#f5f5f5", border: "none", width: 30, height: 30,
                borderRadius: 8, cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* Sessions */}
          {showSessions && (
            <div style={{
              background: "#fafafa", borderBottom: "1px solid #f0f0f0",
              padding: "8px", maxHeight: 140, overflowY: "auto",
            }}>
              {sessions.length === 0 && <div style={{ fontSize: 12, color: "#999", padding: "8px 10px" }}>No chats yet</div>}
              {sessions.map((s) => (
                <div key={s.id} onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }} style={{
                  padding: "8px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  background: s.id === activeSessionId ? "#E8F5E9" : "transparent",
                  color: s.id === activeSessionId ? "#00A87A" : "#555",
                  fontWeight: s.id === activeSessionId ? 600 : 400,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{s.title}</div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {!activeSession || activeSession.messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  background: "#f9f9f9", border: "1px solid #f0f0f0",
                  borderRadius: "10px 10px 10px 2px", padding: "12px 14px",
                  fontSize: 13, color: "#444", lineHeight: 1.6,
                }}>
                  👋 Hey! I&apos;m your Groww MF Assistant. Ask me any factual question about HDFC mutual funds listed on Groww. Try one of these:
                </div>
                <div style={{
                  background: "#fff8e1", border: "1px solid #ffe082",
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 11, color: "#795548", lineHeight: 1.5,
                }}>
                  🔒 Do not share personal info like PAN, Aadhaar, phone or account numbers.
                </div>
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)} style={{
                    background: "#fff", border: "1px solid #00D09C",
                    color: "#00A87A", padding: "9px 14px", borderRadius: 8,
                    fontSize: 12, cursor: "pointer", textAlign: "left" as const, fontWeight: 500,
                  }}>{q}</button>
                ))}
              </div>
            ) : (
              <>
                {activeSession.messages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "88%", padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      background: msg.role === "user" ? "#00D09C" : "#f9f9f9",
                      border: msg.role === "user" ? "none" : "1px solid #f0f0f0",
                      color: msg.role === "user" ? "#fff" : "#333",
                      fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                    }}>{msg.content}</div>
                    {msg.source && msg.role === "assistant" && (
                      <a href={msg.source} target="_blank" rel="noopener noreferrer" style={{
                        marginTop: 5, fontSize: 11, color: "#00A87A",
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                      }}>🔗 View source · {new Date().toLocaleDateString("en-IN")}</a>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flexShrink: 0 }}>
                      <GrowwLogo size={26} />
                    </div>
                    <div style={{
                      background: "#f9f9f9", border: "1px solid #f0f0f0",
                      borderRadius: "10px 10px 10px 2px", padding: "10px 14px",
                      display: "flex", gap: 4,
                    }}>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px", borderTop: "1px solid #f0f0f0" }}>
            <div style={{
              display: "flex", gap: 8, background: "#f9f9f9",
              border: "1px solid #e8e8e8", borderRadius: 10,
              padding: "6px 6px 6px 12px", alignItems: "center",
            }}>
              <input
                ref={inputRef} type="text"
                placeholder="Ask a factual question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#1a1a2e", fontSize: 13, fontFamily: "inherit",
                }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={{
                background: input.trim() ? "#00D09C" : "#e8e8e8",
                color: input.trim() ? "#fff" : "#aaa",
                border: "none", width: 32, height: 32, borderRadius: 8,
                fontSize: 15, cursor: input.trim() ? "pointer" : "default",
                fontWeight: 700, flexShrink: 0,
              }}>&#8594;</button>
            </div>
            <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 6 }}>
              Facts only · No investment advice · Sources cited
            </div>
          </div>
        </div>
      )}
    </div>
  );
}