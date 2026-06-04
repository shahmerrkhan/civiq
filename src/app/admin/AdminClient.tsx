"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

type Card = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string | null;
  sourceName: string | null;
  perspectives: { left: string; centre: string; right: string } | null;
  category: string | null;
  approved: boolean;
  createdAt: Date;
};

type Poll = {
  id: string;
  cardId: string | null;
  question: string;
  options: string[];
  expiresAt: Date | null;
};

export default function AdminClient({ cards: initial, polls }: { cards: Card[]; polls: Poll[] }) {
  const [cards, setCards] = useState(initial);
  const [tab, setTab] = useState<"pending" | "approved" | "create">("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    summary: "",
    sourceUrl: "",
    sourceName: "",
    category: "Systems",
    leftPerspective: "",
    centrePerspective: "",
    rightPerspective: "",
    pollQuestion: "",
    pollOptions: ["", ""],
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestMsg, setDigestMsg] = useState("");

  const handleSendDigest = async () => {
    setSendingDigest(true);
    const res = await fetch("/api/digest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
      },
    });
    const data = await res.json();
    setDigestMsg(data.sent ? `✓ Sent to ${data.sent} users` : "Failed — check console");
    setSendingDigest(false);
    setTimeout(() => setDigestMsg(""), 4000);
  };
  
  const pending = cards.filter(c => !c.approved);
  const approved = cards.filter(c => c.approved);

  const handleApprove = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    });
    setCards(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c));
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCards(prev => prev.filter(c => c.id !== id));
    setLoading(null);
  };

  const handleUnapprove = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: false }),
    });
    setCards(prev => prev.map(c => c.id === id ? { ...c, approved: false } : c));
    setLoading(null);
  };

  const addPollOption = () => {
    if (createForm.pollOptions.length < 5) {
      setCreateForm(f => ({ ...f, pollOptions: [...f.pollOptions, ""] }));
    }
  };

  const updatePollOption = (i: number, val: string) => {
    setCreateForm(f => {
      const opts = [...f.pollOptions];
      opts[i] = val;
      return { ...f, pollOptions: opts };
    });
  };

  const removePollOption = (i: number) => {
    if (createForm.pollOptions.length > 2) {
      setCreateForm(f => ({ ...f, pollOptions: f.pollOptions.filter((_, idx) => idx !== i) }));
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.summary.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createForm.title,
        summary: createForm.summary,
        sourceUrl: createForm.sourceUrl || null,
        sourceName: createForm.sourceName || null,
        category: createForm.category,
        perspectives: {
          left: createForm.leftPerspective,
          centre: createForm.centrePerspective,
          right: createForm.rightPerspective,
        },
        pollQuestion: createForm.pollQuestion || null,
        pollOptions: createForm.pollOptions.filter(o => o.trim()),
      }),
    });
    const data = await res.json();
    if (data.card) {
      setCards(prev => [data.card, ...prev]);
      setSuccessMsg("Card created and sent to pending review.");
      setCreateForm({
        title: "", summary: "", sourceUrl: "", sourceName: "",
        category: "Systems", leftPerspective: "", centrePerspective: "",
        rightPerspective: "", pollQuestion: "", pollOptions: ["", ""],
      });
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSubmitting(false);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px", color: "#fff",
    fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "12px", color: "#444", fontWeight: "700",
    letterSpacing: "0.06em", textTransform: "uppercase" as const,
    marginBottom: "8px", display: "block",
  };

  const categories = ["Systems", "Ideologies", "Figures", "Canada & World", "Issues"];

  const categoryColor: Record<string, string> = {
    Systems: "#60a5fa",
    Ideologies: "#a78bfa",
    Figures: "#f5a623",
    "Canada & World": "#34d399",
    Issues: "#fb923c",
  };

  const renderCardList = (list: Card[], showUnapprove = false) => (
    <AnimatePresence>
      {list.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}
        >
          {showUnapprove ? "No approved cards yet." : "Nothing pending — you're all clear."}
        </motion.div>
      )}
      {list.map((card, i) => {
        const pollForCard = polls.find(p => p.cardId === card.id);
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, scale: 0.97 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px", padding: "20px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  {card.category && (
                    <span style={{
                      fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: categoryColor[card.category] || "#f5a623",
                      backgroundColor: `${categoryColor[card.category] || "#f5a623"}15`,
                      padding: "2px 8px", borderRadius: "100px",
                    }}>{card.category}</span>
                  )}
                  {pollForCard && (
                    <span style={{
                      fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "#4ade80",
                      backgroundColor: "rgba(74,222,128,0.1)",
                      padding: "2px 8px", borderRadius: "100px",
                    }}>Has poll</span>
                  )}
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "6px", lineHeight: "1.4" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
                  {card.summary}
                </div>
              </div>
            </div>

            {card.perspectives && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {(["left", "centre", "right"] as const).map(side => (
                  card.perspectives![side] && (
                    <div key={side} style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "10px", padding: "10px",
                    }}>
                      <div style={{ fontSize: "10px", color: "#444", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{side}</div>
                      <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>{card.perspectives![side]}</div>
                    </div>
                  )
                ))}
              </div>
            )}

            {card.sourceUrl && (
              <div style={{ marginBottom: "14px" }}>
                <a href={card.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#444", textDecoration: "none" }}>
                  {card.sourceName || card.sourceUrl} ↗
                </a>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              {!showUnapprove ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleApprove(card.id)}
                    disabled={loading === card.id}
                    style={{
                      padding: "9px 20px", borderRadius: "10px", border: "none",
                      backgroundColor: "#4ade80", color: "#000",
                      fontSize: "13px", fontWeight: "700", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1,
                    }}
                  >{loading === card.id ? "..." : "Approve"}</motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleReject(card.id)}
                    disabled={loading === card.id}
                    style={{
                      padding: "9px 20px", borderRadius: "10px",
                      border: "1px solid rgba(248,113,113,0.3)",
                      backgroundColor: "rgba(248,113,113,0.08)", color: "#f87171",
                      fontSize: "13px", fontWeight: "700", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1,
                    }}
                  >{loading === card.id ? "..." : "Delete"}</motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleUnapprove(card.id)}
                  disabled={loading === card.id}
                  style={{
                    padding: "9px 20px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "transparent", color: "#888",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1,
                  }}
                >{loading === card.id ? "..." : "Unpublish"}</motion.button>
              )}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );

  return (
    <AppLayout active="/dashboard">
      <div style={{ padding: "24px 20px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "28px" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Admin</div>
            <div style={{ fontSize: "14px", color: "#444" }}>
              {pending.length} pending · {approved.length} live
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSendDigest}
              disabled={sendingDigest}
              style={{
                padding: "9px 18px", borderRadius: "10px",
                border: "1px solid rgba(245,166,35,0.3)",
                backgroundColor: "rgba(245,166,35,0.08)", color: "#f5a623",
                fontSize: "13px", fontWeight: "700", cursor: sendingDigest ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", opacity: sendingDigest ? 0.6 : 1,
              }}
            >{sendingDigest ? "Sending..." : "📧 Send weekly digest"}</motion.button>
            {digestMsg && <div style={{ fontSize: "12px", color: "#4ade80" }}>{digestMsg}</div>}
          </div>
        </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: "flex", gap: "8px", marginBottom: "32px" }}
        >
          {(["pending", "approved", "create"] as const).map(t => (
            <motion.button
              key={t}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: "100px",
                fontSize: "13px", fontWeight: "600",
                border: tab === t ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: tab === t ? "rgba(245,166,35,0.1)" : "transparent",
                color: tab === t ? "#f5a623" : "#555",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
                textTransform: "capitalize",
              }}
            >
              {t === "pending" ? `Pending (${pending.length})` : t === "approved" ? `Live (${approved.length})` : "Create"}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === "pending" && (
            <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {renderCardList(pending)}
            </motion.div>
          )}

          {tab === "approved" && (
            <motion.div key="approved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {renderCardList(approved, true)}
            </motion.div>
          )}

          {tab === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      padding: "12px 16px", borderRadius: "10px",
                      backgroundColor: "rgba(74,222,128,0.1)",
                      border: "1px solid rgba(74,222,128,0.2)",
                      color: "#4ade80", fontSize: "13px", fontWeight: "600",
                      marginBottom: "20px",
                    }}
                  >{successMsg}</motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                <div>
                  <label style={labelStyle}>Title</label>
                  <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="What's this issue about?" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Summary</label>
                  <textarea
                    value={createForm.summary}
                    onChange={e => setCreateForm(f => ({ ...f, summary: e.target.value }))}
                    placeholder="2–3 sentence neutral summary of the issue."
                    rows={3}
                    style={{ ...inputStyle, resize: "none" }}
                  />
                </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Source URL</label>
                    <input value={createForm.sourceUrl} onChange={e => setCreateForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Source Name</label>
                    <input value={createForm.sourceName} onChange={e => setCreateForm(f => ({ ...f, sourceName: e.target.value }))} placeholder="CBC, Globe and Mail..." style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Category</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {categories.map(cat => (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCreateForm(f => ({ ...f, category: cat }))}
                        style={{
                          padding: "6px 16px", borderRadius: "100px",
                          fontSize: "13px", fontWeight: "600",
                          border: createForm.category === cat ? `1px solid ${categoryColor[cat]}` : "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: createForm.category === cat ? `${categoryColor[cat]}15` : "transparent",
                          color: createForm.category === cat ? categoryColor[cat] : "#555",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >{cat}</motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Perspectives</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    {(["leftPerspective", "centrePerspective", "rightPerspective"] as const).map((key, i) => (
                      <div key={key}>
                        <div style={{ fontSize: "11px", color: "#444", marginBottom: "6px", fontWeight: "600" }}>
                          {["Left", "Centre", "Right"][i]}
                        </div>
                        <textarea
                          value={createForm[key]}
                          onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={`${["Left", "Centre", "Right"][i]} take on this...`}
                          rows={3}
                          style={{ ...inputStyle, resize: "none", fontSize: "13px" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Poll (optional)</label>
                  <input
                    value={createForm.pollQuestion}
                    onChange={e => setCreateForm(f => ({ ...f, pollQuestion: e.target.value }))}
                    placeholder="Poll question..."
                    style={{ ...inputStyle, marginBottom: "10px" }}
                  />
                  {createForm.pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input
                        value={opt}
                        onChange={e => updatePollOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      {createForm.pollOptions.length > 2 && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removePollOption(i)}
                          style={{
                            padding: "0 14px", borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "transparent", color: "#555",
                            cursor: "pointer", fontSize: "18px",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >×</motion.button>
                      )}
                    </div>
                  ))}
                  {createForm.pollOptions.length < 5 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={addPollOption}
                      style={{
                        padding: "8px 16px", borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "transparent", color: "#555",
                        fontSize: "13px", cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >+ Add option</motion.button>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={submitting || !createForm.title.trim() || !createForm.summary.trim()}
                  style={{
                    padding: "14px", borderRadius: "12px",
                    border: "none", backgroundColor: "#f5a623",
                    color: "#000", fontSize: "14px", fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: submitting || !createForm.title.trim() || !createForm.summary.trim() ? 0.5 : 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {submitting ? "Creating..." : "Create card"}
                </motion.button>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}