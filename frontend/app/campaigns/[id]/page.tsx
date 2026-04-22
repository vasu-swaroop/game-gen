"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Campaign, getCampaign, sendMessage, ChatMessage, updateCampaign } from "../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface UIMessage {
  id: string;
  role: "user" | "dm";
  content: string;
  timestamp: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function DM_AVATAR() {
  return (
    <div
      className="message-avatar avatar-dm"
      title="Dungeon Master"
      style={{ fontSize: "1.1rem" }}
    >
      🎲
    </div>
  );
}

function USER_AVATAR() {
  return (
    <div
      className="message-avatar avatar-user"
      title="You"
      style={{ fontSize: "0.85rem", fontWeight: 700 }}
    >
      YOU
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Renders DM response with basic markdown (bold, line breaks)
function DMText({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);
  return (
    <div className="dm-prose" style={{ fontFamily: "var(--font-body)", fontSize: "1.07rem", lineHeight: 1.75, color: "var(--text-primary)" }}>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? "0.8em" : 0 }}>
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line.split(/(\*\*[^*]+\*\*)/).map((chunk, k) =>
                chunk.startsWith("**") && chunk.endsWith("**") ? (
                  <strong key={k} style={{ color: "var(--gold-bright)", fontWeight: 600 }}>
                    {chunk.slice(2, -2)}
                  </strong>
                ) : (
                  chunk
                )
              )}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="message-row animate-fade-in">
      <DM_AVATAR />
      <div className="message-bubble dm-bubble">
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ── Campaign sidebar ──────────────────────────────────────────────────────────
function CampaignSidebar({
  campaign,
  onUpdate,
}: {
  campaign: Campaign | null;
  onUpdate?: (c: Campaign) => void;
}) {
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (campaign?.system_instructions) {
      setInstructions(campaign.system_instructions);
    }
  }, [campaign]);

  const handleSave = async () => {
    if (!campaign) return;
    try {
      const updated = await updateCampaign(campaign.id, {
        system_instructions: instructions,
      });
      onUpdate?.(updated);
      setEditingInstructions(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update instructions");
    }
  };

  if (!campaign) return null;
  return (
    <div className="side-panel" style={{ width: "240px", flexShrink: 0, paddingBottom: "40px" }}>
      <div>
        <p className="panel-section-title">Campaign</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" }}>
          {campaign.name}
        </p>
        {campaign.description && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {campaign.description}
          </p>
        )}
        {campaign.dm_name && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>
            🧙 DM: {campaign.dm_name}
          </p>
        )}
      </div>

      <div className="divider" style={{ margin: "16px 0" }} />

      <div>
        <p className="panel-section-title">DM Control</p>
        {editingInstructions ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              className="form-textarea"
              style={{ fontSize: "0.8rem", minHeight: "120px", padding: "8px", background: "var(--bg-void)" }}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter system instructions to guide the AI DM..."
            />
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingInstructions(false)}>
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "flex-start", gap: "8px", fontSize: "0.75rem", padding: "8px 12px" }}
            onClick={() => setEditingInstructions(true)}
          >
            📜 {campaign.system_instructions ? "Edit Instructions" : "Set Instructions"}
          </button>
        )}
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
          Instructions guide the DM's personality and rules.
        </p>
      </div>

      <div className="divider" style={{ margin: "16px 0" }} />

      <div>
        <p className="panel-section-title">Tips</p>
        <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: 0, listStyle: "none" }}>
          {[
            "Describe your actions in detail",
            "You can ask to roll for checks",
            "Mention NPCs by name",
            "Press Enter to send quickly",
          ].map((tip) => (
            <li key={tip} style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-ui)", lineHeight: 1.5 }}>
              • {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PlayCampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = parseInt(params.id, 10);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [campaignError, setCampaignError] = useState("");

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);   // history sent to backend
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(`campaign_${campaignId}_${Date.now()}`);

  // Load campaign
  useEffect(() => {
    getCampaign(campaignId)
      .then(setCampaign)
      .catch((err) => setCampaignError(err.message ?? "Campaign not found"))
      .finally(() => setLoadingCampaign(false));
  }, [campaignId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: UIMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: text },
    ];

    try {
      const res = await sendMessage({
        session_id: sessionId.current,
        user_message: text,
        history: updatedHistory,
      });

      const dmMsg: UIMessage = {
        id: `d_${Date.now()}`,
        role: "dm",
        content: res.bot_response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, dmMsg]);
      setHistory([
        ...updatedHistory,
        { role: "assistant", content: res.bot_response },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to reach Dungeon Master";
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "dm",
          content: `⚠ **Error:** ${errMsg}\n\nCheck that the backend server is running on port 8006.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingCampaign) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          background: "var(--bg-void)",
        }}
      >
        <div className="spinner" />
        <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
          Opening the campaign scroll…
        </p>
      </div>
    );
  }

  if (campaignError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "3rem" }}>💀</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem" }}>Campaign Not Found</h1>
        <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{campaignError}</p>
        <Link href="/campaigns" className="btn btn-ghost">← Back to Campaigns</Link>
      </div>
    );
  }

  // ── Chat UI ────────────────────────────────────────────────────────────────
  return (
    <div className="chat-wrapper" style={{ background: "var(--bg-void)" }}>
      {/* ── top bar ── */}
      <header className="chat-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Left: back + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
            <Link href="/campaigns" className="btn btn-ghost btn-sm btn-icon" title="Back to campaigns">
              ←
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {campaign?.name ?? "Campaign"}
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
                {campaign?.dm_name ? `DM: ${campaign.dm_name}` : "AI Dungeon Master"}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge badge-rune" style={{ display: "none" /* remove when HP is tracked */ }}>
              Session Active
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSidebarOpen((o) => !o)}
              title="Toggle sidebar"
              style={{ fontSize: "1rem" }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>
      </header>

      {/* ── body (messages + sidebar) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Messages */}
        <div className="chat-messages-area" style={{ flex: 1 }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {messages.length === 0 ? (
              /* Welcome card */
              <div style={{ margin: "auto", paddingTop: "40px", width: "100%" }}>
                <div className="welcome-card animate-fade-in-up">
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎲</div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      marginBottom: "12px",
                      background: "linear-gradient(135deg, var(--rune-bright), var(--gold-bright))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Welcome, Adventurer!
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1.1rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                      marginBottom: "24px",
                    }}
                  >
                    Your Dungeon Master stirs in the shadows, ready to weave your tale.
                    Type your first action below — describe what you do, say, or examine.
                  </p>
                  <div className="rune-line" style={{ justifyContent: "center" }}>
                    Press Enter or click Send to begin your adventure
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${msg.role === "user" ? "user-row" : ""} animate-fade-in-up`}
                >
                  {msg.role === "dm" ? <DM_AVATAR /> : <USER_AVATAR />}
                  <div>
                    <div className={`message-bubble ${msg.role === "dm" ? "dm-bubble" : "user-bubble"}`}>
                      {msg.role === "dm" ? (
                        <DMText content={msg.content} />
                      ) : (
                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.97rem", lineHeight: 1.6 }}>
                          {msg.content}
                        </p>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-faint)",
                        fontFamily: "var(--font-ui)",
                        marginTop: "4px",
                        textAlign: msg.role === "user" ? "right" : "left",
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {sending && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && <CampaignSidebar campaign={campaign} onUpdate={setCampaign} />}
      </div>

      {/* ── input bar ── */}
      <div className="chat-footer">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
              background: "var(--bg-elevated)",
              border: `1px solid ${sending ? "var(--rune-mid)" : "var(--border-mid)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "12px 16px",
              transition: "border-color 0.25s",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you do? (e.g. 'I approach the ancient door and examine the runes…')"
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontFamily: "var(--font-ui)",
                fontSize: "0.97rem",
                lineHeight: 1.6,
                resize: "none",
                maxHeight: "160px",
                scrollbarWidth: "thin",
              }}
            />
            <button
              id="send-message-btn"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, alignSelf: "flex-end" }}
              title="Send (Enter)"
            >
              {sending ? (
                <span className="spinner spinner-sm" style={{ borderTopColor: "var(--bg-deep)" }} />
              ) : (
                "Send ➤"
              )}
            </button>
          </div>
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-ui)",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            Enter to send · Shift+Enter for new line · Your DM is an AI — be creative!
          </p>
        </div>
      </div>
    </div>
  );
}
