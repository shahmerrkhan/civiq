"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

type Message = {
  id: string;
  user_id: string;
  type: "steelman" | "argument";
  content: string;
  steelman_approved: boolean | null;
  created_at: string;
};

type Room = {
  id: string;
  card_db_id: string;
  card_title: string;
  card_summary: string;
  user_a_id: string;
  user_b_id: string | null;
  user_a_leaning: string;
  user_b_leaning: string | null;
  status: string;
  expires_at: string | null;
};

function timeLeft(expiresAt: string | null) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function DebateClient({ roomId, userId }: { roomId: string; userId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"steelman" | "argument">("steelman");
  const [steelmanFeedback, setSteelmanFeedback] = useState<{ approved: boolean; feedback: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myLeaning = room?.user_a_id === userId ? room?.user_a_leaning : room?.user_b_leaning;
  const theirLeaning = room?.user_a_id === userId ? room?.user_b_leaning : room?.user_a_leaning;
  const amUserA = room?.user_a_id === userId;

  const leaningColor = (l: string | null | undefined) => {
    if (!l) return "#888";
    if (l === "left") return "#a78bfa";
    if (l === "right") return "#60a5fa";
    return "#34d399";
  };

  const leaningLabel = (l: string | null | undefined) => {
    if (!l) return "Unknown";
    return l.charAt(0).toUpperCase() + l.slice(1);
  };

  useEffect(() => {
    if (!room?.expires_at) return;
    const t = setInterval(() => setTimeRemaining(timeLeft(room.expires_at)), 30000);
    // Syncs countdown display with room data, intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeRemaining(timeLeft(room.expires_at));
    return () => clearInterval(t);
  }, [room?.expires_at]);

  useEffect(() => {
    // Determine phase based on my messages
    const myMessages = messages.filter(m => m.user_id === userId);
    const hasApprovedSteelman = myMessages.some(m => m.type === "steelman" && m.steelman_approved === true);
    // Derives debate phase from message history, intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasApprovedSteelman) setPhase("argument");
    else setPhase("steelman");
  }, [messages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadRoom() {
    const res = await fetch(`/api/debate/rooms?roomId=${roomId}`);
    const data = await res.json();
    if (data.room) setRoom(data.room);
    setLoading(false);
  }

  async function loadMessages() {
    const res = await fetch(`/api/debate/messages?roomId=${roomId}`);
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  }

  useEffect(() => {
    // Initial + polling data load, intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoom();
    loadMessages();
    pollRef.current = setInterval(() => {
      loadRoom();
      loadMessages();
    }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roomId]);

  async function handleSubmit() {
    if (!input.trim() || submitting) return;
    setError(null);

    if (phase === "steelman") {
      // Validate first
      setValidating(true);
      const res = await fetch("/api/debate/steelman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input,
          cardTitle: room?.card_title,
          opposingLeaning: theirLeaning ?? "the other side",
        }),
      });
      const feedback = await res.json();
      setValidating(false);
      setSteelmanFeedback(feedback);

      if (!feedback.approved) return;

      // Save approved steelman
      setSubmitting(true);
      const saveRes = await fetch("/api/debate/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "steelman", content: input, steelmanApproved: true }),
      });
      const saved = await saveRes.json();
      if (saved.message) {
        setMessages(prev => [...prev, saved.message]);
        setInput("");
        setSteelmanFeedback(null);
        setPhase("argument");
      } else {
        setError(saved.error ?? "Could not save message.");
      }
      setSubmitting(false);
    } else {
      // Argument
      setSubmitting(true);
      const res = await fetch("/api/debate/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "argument", content: input }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setInput("");
      } else {
        setError(data.error ?? "Could not post message.");
      }
      setSubmitting(false);
    }
  }

  if (loading) return (
        <AppLayout active="/debate">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{ width: "32px", height: "32px", border: "2px solid rgba(245,166,35,0.15)", borderTopColor: "#f5a623", borderRadius: "50%" }} />
      </div>
    </AppLayout>
  );

  if (!room) return (
    <AppLayout active="/debate">
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>Room not found. <Link href="/dashboard" style={{ color: "#f5a623" }}>Go back</Link></div>
    </AppLayout>
  );

  const isClosed = room.status === "closed";
  const isWaiting = room.status === "waiting";

  return (
    <AppLayout active="/debate">  
        <style>{`
        .debate-input:focus { outline: none; border-color: rgba(245,166,35,0.4) !important; }
        .debate-input::placeholder { color: #333; }
      `}</style>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 20px)", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
          <Link href="/dashboard" style={{ fontSize: "12px", color: "#444", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
            ← Back to feed
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5a623" }}>
              Common Ground
            </div>
            {timeRemaining && !isClosed && (
              <div style={{ fontSize: "11px", color: "#444", fontWeight: "600" }}>· {timeRemaining}</div>
            )}
            {isClosed && (
              <div style={{ fontSize: "11px", color: "#555", fontWeight: "600", padding: "2px 10px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)" }}>Closed</div>
            )}
          </div>
          <div style={{ fontSize: "clamp(16px, 3vw, 20px)", fontWeight: "800", letterSpacing: "-0.5px", lineHeight: "1.3", marginBottom: "12px" }}>
            {room.card_title}
          </div>
          <div style={{ fontSize: "13px", color: "#444", lineHeight: "1.7", marginBottom: "16px" }}>
            {room.card_summary}
          </div>

          {/* Participants */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "12px", color: leaningColor(amUserA ? room.user_a_leaning : room.user_b_leaning), padding: "4px 12px", borderRadius: "100px", border: `1px solid ${leaningColor(amUserA ? room.user_a_leaning : room.user_b_leaning)}30`, backgroundColor: `${leaningColor(amUserA ? room.user_a_leaning : room.user_b_leaning)}0d`, fontWeight: "700" }}>
              You · {leaningLabel(myLeaning)}
            </div>
            {room.user_b_id ? (
              <div style={{ fontSize: "12px", color: leaningColor(amUserA ? room.user_b_leaning : room.user_a_leaning), padding: "4px 12px", borderRadius: "100px", border: `1px solid ${leaningColor(amUserA ? room.user_b_leaning : room.user_a_leaning)}30`, backgroundColor: `${leaningColor(amUserA ? room.user_b_leaning : room.user_a_leaning)}0d`, fontWeight: "700" }}>
                Opponent · {leaningLabel(theirLeaning)}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#333", padding: "4px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.06)", fontWeight: "600" }}>
                Waiting for opponent...
              </div>
            )}
          </div>
        </motion.div>

        {/* Waiting state */}
        {isWaiting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "32px 24px", borderRadius: "16px", backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", textAlign: "center", marginBottom: "24px" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</motion.div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", marginBottom: "6px" }}>Looking for your match</div>
            <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
              When someone with a different political leaning joins this issue, you&apos;ll both be matched and the 72-hour debate window opens.
            </div>
          </motion.div>
        )}

        {/* Phase guide */}
        {!isClosed && !isWaiting && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: "20px", padding: "16px 18px", borderRadius: "12px", backgroundColor: phase === "steelman" ? "rgba(167,139,250,0.05)" : "rgba(245,166,35,0.05)", border: `1px solid ${phase === "steelman" ? "rgba(167,139,250,0.15)" : "rgba(245,166,35,0.12)"}` }}>
            {phase === "steelman" ? (
              <>
                <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", marginBottom: "6px" }}>Step 1 — Steelman</div>
                <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.7" }}>
                  Before sharing your view, write the <strong style={{ color: "#ccc" }}>strongest possible version</strong> of the {leaningLabel(theirLeaning)} argument on this issue. Not what you think is wrong with it — what&apos;s actually right about it. The AI checks if it&apos;s genuine.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", marginBottom: "6px" }}>Step 2 — Your Argument</div>
                <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.7" }}>
                  Steelman accepted. Now make your actual case. Keep it grounded — you&apos;ve already shown you understand the other side.
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Messages */}
        <div style={{ marginBottom: "20px" }}>
          <AnimatePresence>
            {messages.map((msg) => {
              const isMe = msg.user_id === userId;
              const isSteelman = msg.type === "steelman";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: "12px", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: isSteelman ? "#a78bfa" : (isMe ? "#f5a623" : "#60a5fa"), marginBottom: "4px" }}>
                    {isMe ? "You" : "Opponent"} · {isSteelman ? "Steelman" : "Argument"}
                  </div>
                  <div style={{ maxWidth: "85%", padding: "14px 16px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: isMe ? "rgba(245,166,35,0.08)" : "rgba(96,165,250,0.06)", border: `1px solid ${isMe ? "rgba(245,166,35,0.15)" : "rgba(96,165,250,0.12)"}`, fontSize: "14px", color: "#ccc", lineHeight: "1.7" }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: "10px", color: "#333", marginTop: "4px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {messages.length === 0 && !isWaiting && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#333", fontSize: "13px" }}>
              No messages yet. Start with your steelman above.
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Steelman feedback */}
        <AnimatePresence>
          {steelmanFeedback && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: "16px", padding: "14px 16px", borderRadius: "12px", backgroundColor: steelmanFeedback.approved ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${steelmanFeedback.approved ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
              <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: steelmanFeedback.approved ? "#34d399" : "#f87171", marginBottom: "6px" }}>
                {steelmanFeedback.approved ? "✓ Steelman accepted" : "× Try again"}
              </div>
              <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6" }}>{steelmanFeedback.feedback}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: "12px", fontSize: "13px", color: "#f87171" }}>{error}</div>
        )}

        {/* Input */}
        {!isClosed && !isWaiting && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <textarea
              className="debate-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={phase === "steelman"
                ? `Write the strongest version of the ${leaningLabel(theirLeaning)} argument on this issue...`
                : "Now make your actual argument..."}
              rows={4}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 16px", fontSize: "14px", color: "#f0ede6", fontFamily: "'DM Sans', sans-serif", resize: "vertical", lineHeight: "1.7", transition: "border-color 0.2s ease" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "12px", color: "#333" }}>{input.length} chars · min 20</div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting || validating || input.trim().length < 20}
                style={{ padding: "10px 24px", borderRadius: "10px", backgroundColor: (submitting || validating || input.trim().length < 20) ? "rgba(255,255,255,0.05)" : (phase === "steelman" ? "rgba(167,139,250,0.15)" : "rgba(245,166,35,0.15)"), border: `1px solid ${(submitting || validating || input.trim().length < 20) ? "rgba(255,255,255,0.08)" : (phase === "steelman" ? "rgba(167,139,250,0.3)" : "rgba(245,166,35,0.3)")}`, color: (submitting || validating || input.trim().length < 20) ? "#333" : (phase === "steelman" ? "#a78bfa" : "#f5a623"), fontSize: "13px", fontWeight: "700", cursor: (submitting || validating || input.trim().length < 20) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease" }}
              >
                {validating ? "Checking..." : submitting ? "Posting..." : phase === "steelman" ? "Submit steelman →" : "Post argument →"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {isClosed && (
          <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>🔒</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f0ede6", marginBottom: "4px" }}>This debate has closed</div>
            <div style={{ fontSize: "13px", color: "#444" }}>The 72-hour window ended. The exchange is preserved above.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}








