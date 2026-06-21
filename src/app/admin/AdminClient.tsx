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

type WitnessEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  deadlineAt: string;
  status: string;
  outcome: string | null;
  outcomeExplanation: string | null;
  sourceUrl: string | null;
  weekStart: string;
};

type ForecastQuestion = {
  id: string;
  question: string;
  context: string;
  category: string;
  closesAt: string;
  resolvesAt: string;
  status: string;
  outcome: boolean | null;
  outcomeExplanation: string | null;
  weekStart: string;
};

export default function AdminClient({
  cards: initial,
  polls,
  witnessEvents: initialWitness,
  forecastQuestions: initialForecast,
}: {
  cards: Card[];
  polls: Poll[];
  witnessEvents: WitnessEvent[];
  forecastQuestions: ForecastQuestion[];
}) {
  const [cards, setCards] = useState(initial);
  const [witnessEvents, setWitnessEvents] = useState(initialWitness);
  const [forecastQuestions, setForecastQuestions] = useState(initialForecast);
  const [tab, setTab] = useState<"pending" | "approved" | "create" | "witness" | "forecast">("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestMsg, setDigestMsg] = useState("");
  const [blastForm, setBlastForm] = useState({ title: "", body: "", url: "/daily" });
  const [sendingBlast, setSendingBlast] = useState(false);
  const [blastMsg, setBlastMsg] = useState("");

  const [createForm, setCreateForm] = useState({
    title: "", summary: "", sourceUrl: "", sourceName: "",
    category: "Systems", leftPerspective: "", centrePerspective: "",
    rightPerspective: "", pollQuestion: "", pollOptions: ["", ""],
  });

  const [witnessForm, setWitnessForm] = useState({
    title: "", description: "", category: "Legislature",
    deadlineAt: "", sourceUrl: "", weekStart: "",
  });

  const [forecastForm, setForecastForm] = useState({
    question: "", context: "", category: "Legislature",
    closesAt: "", resolvesAt: "", weekStart: "",
  });

  const [resolveData, setResolveData] = useState<{
    id: string;
    outcome: "true" | "false";
    explanation: string;
  } | null>(null);
  const [resolving, setResolving] = useState(false);

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
  const eventCategories = ["Legislature", "Courts", "Municipal", "Federal", "Budget", "Election", "Environment", "Housing"];

  const categoryColor: Record<string, string> = {
    Systems: "#60a5fa", Ideologies: "#a78bfa", Figures: "#f5a623",
    "Canada & World": "#34d399", Issues: "#fb923c",
    Legislature: "#60a5fa", Courts: "#f87171", Municipal: "#34d399",
    Federal: "#a78bfa", Budget: "#f5a623", Election: "#fb923c",
    Environment: "#4ade80", Housing: "#e879f9",
  };

  const pending = cards.filter(c => !c.approved);
  const approved = cards.filter(c => c.approved);

  // ── Card handlers ──────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved: true }) });
    setCards(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c));
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCards(prev => prev.filter(c => c.id !== id));
    setLoading(null);
  };

  const handleUnapprove = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/cards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approved: false }) });
    setCards(prev => prev.map(c => c.id === id ? { ...c, approved: false } : c));
    setLoading(null);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.summary.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/cards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createForm.title, summary: createForm.summary,
        sourceUrl: createForm.sourceUrl || null, sourceName: createForm.sourceName || null,
        category: createForm.category,
        perspectives: { left: createForm.leftPerspective, centre: createForm.centrePerspective, right: createForm.rightPerspective },
        pollQuestion: createForm.pollQuestion || null,
        pollOptions: createForm.pollOptions.filter(o => o.trim()),
      }),
    });
    const data = await res.json();
    if (data.card) {
      setCards(prev => [data.card, ...prev]);
      setSuccessMsg("Card created and sent to pending review.");
      setCreateForm({ title: "", summary: "", sourceUrl: "", sourceName: "", category: "Systems", leftPerspective: "", centrePerspective: "", rightPerspective: "", pollQuestion: "", pollOptions: ["", ""] });
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSubmitting(false);
  };

  // ── Witness handlers ───────────────────────────────────────
  const handleCreateWitness = async () => {
    if (!witnessForm.title.trim() || !witnessForm.description.trim() || !witnessForm.deadlineAt || !witnessForm.weekStart) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/witness", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(witnessForm),
    });
    const data = await res.json();
    if (data.event) {
      setWitnessEvents(prev => [data.event, ...prev]);
      setSuccessMsg("Witness event created.");
      setWitnessForm({ title: "", description: "", category: "Legislature", deadlineAt: "", sourceUrl: "", weekStart: "" });
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSubmitting(false);
  };

  const handleResolveWitness = async (id: string, outcome: string, explanation: string) => {
    setLoading(id);
    const res = await fetch("/api/admin/witness", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, outcome, outcomeExplanation: explanation }),
    });
    const data = await res.json();
    if (data.event) {
      setWitnessEvents(prev => prev.map(e => e.id === id ? { ...e, status: "resolved", outcome, outcomeExplanation: explanation } : e));
    }
    setLoading(null);
  };

  const handleDeleteWitness = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/witness", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setWitnessEvents(prev => prev.filter(e => e.id !== id));
    setLoading(null);
  };

  // ── Forecast handlers ──────────────────────────────────────
  const handleCreateForecast = async () => {
    if (!forecastForm.question.trim() || !forecastForm.context.trim() || !forecastForm.closesAt || !forecastForm.resolvesAt || !forecastForm.weekStart) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/forecast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forecastForm),
    });
    const data = await res.json();
    if (data.question) {
      setForecastQuestions(prev => [data.question, ...prev]);
      setSuccessMsg("Forecast question created.");
      setForecastForm({ question: "", context: "", category: "Legislature", closesAt: "", resolvesAt: "", weekStart: "" });
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSubmitting(false);
  };

  const handleManualResolve = async () => {
    if (!resolveData || !resolveData.explanation.trim()) return;
    setResolving(true);
    const res = await fetch("/api/admin/forecast", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: resolveData.id,
        outcome: resolveData.outcome === "true",
        outcomeExplanation: resolveData.explanation,
      }),
    });
    const data = await res.json();
    if (data.question) {
      setForecastQuestions(prev => prev.map(q =>
        q.id === resolveData.id
          ? { ...q, status: "resolved", outcome: resolveData.outcome === "true", outcomeExplanation: resolveData.explanation }
          : q
      ));
      setResolveData(null);
    }
    setResolving(false);
  };

  const handleDeleteForecast = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/forecast", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setForecastQuestions(prev => prev.filter(q => q.id !== id));
    setLoading(null);
  };

  // ── Approve pending AI-generated content ──────────────────
  const handleApproveWitness = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/witness", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approvePending: true }),
    });
    setWitnessEvents(prev => prev.map(e => e.id === id ? { ...e, status: "upcoming" } : e));
    setLoading(null);
  };

  const handleApproveForecast = async (id: string) => {
    setLoading(id);
    await fetch("/api/admin/forecast", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approvePending: true }),
    });
    setForecastQuestions(prev => prev.map(q => q.id === id ? { ...q, status: "open" } : q));
    setLoading(null);
  };

  // ── Digest / Blast ─────────────────────────────────────────
  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await fetch("/api/digest", { method: "GET" });
      const data = await res.json();
      setDigestMsg(data.sent ? `✓ Sent to ${data.sent} users` : `Failed: ${data.error || "check logs"}`);
    } catch (err) {
      setDigestMsg("Failed — check console");
    }
    setSendingDigest(false);
    setTimeout(() => setDigestMsg(""), 4000);
  };

  const handleBlast = async () => {
    if (!blastForm.title.trim() || !blastForm.body.trim()) return;
    setSendingBlast(true);
    const res = await fetch("/api/admin/blast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blastForm) });
    const data = await res.json();
    setBlastMsg(data.sent !== undefined ? `✓ Sent to ${data.sent} devices` : `Failed: ${data.error}`);
    setSendingBlast(false);
    setTimeout(() => setBlastMsg(""), 5000);
  };

  // ── Poll option helpers ────────────────────────────────────
  const addPollOption = () => { if (createForm.pollOptions.length < 5) setCreateForm(f => ({ ...f, pollOptions: [...f.pollOptions, ""] })); };
  const updatePollOption = (i: number, val: string) => { setCreateForm(f => { const opts = [...f.pollOptions]; opts[i] = val; return { ...f, pollOptions: opts }; }); };
  const removePollOption = (i: number) => { if (createForm.pollOptions.length > 2) setCreateForm(f => ({ ...f, pollOptions: f.pollOptions.filter((_, idx) => idx !== i) })); };

  // ── Renderers ──────────────────────────────────────────────
  const renderCardList = (list: Card[], showUnapprove = false) => (
    <AnimatePresence>
      {list.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 0", color: "#555", fontSize: "14px" }}>
          {showUnapprove ? "No approved cards yet." : "Nothing pending — you're all clear."}
        </motion.div>
      )}
      {list.map((card, i) => {
        const pollForCard = polls.find(p => p.cardId === card.id);
        return (
          <motion.div key={card.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, scale: 0.97 }} transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  {card.category && (
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: categoryColor[card.category] || "#f5a623", backgroundColor: `${categoryColor[card.category] || "#f5a623"}15`, padding: "2px 8px", borderRadius: "100px" }}>{card.category}</span>
                  )}
                  {pollForCard && (
                    <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: "100px" }}>Has poll</span>
                  )}
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "6px", lineHeight: "1.4" }}>{card.title}</div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>{card.summary}</div>
              </div>
            </div>
            {card.perspectives && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {(["left", "centre", "right"] as const).map(side => (
                  card.perspectives![side] && (
                    <div key={side} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px" }}>
                      <div style={{ fontSize: "10px", color: "#444", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{side}</div>
                      <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>{card.perspectives![side]}</div>
                    </div>
                  )
                ))}
              </div>
            )}
            {card.sourceUrl && (
              <div style={{ marginBottom: "14px" }}>
                <a href={card.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#444", textDecoration: "none" }}>{card.sourceName || card.sourceUrl} ↗</a>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              {!showUnapprove ? (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleApprove(card.id)} disabled={loading === card.id}
                    style={{ padding: "9px 20px", borderRadius: "10px", border: "none", backgroundColor: "#4ade80", color: "#000", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1 }}
                  >{loading === card.id ? "..." : "Approve"}</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleReject(card.id)} disabled={loading === card.id}
                    style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1 }}
                  >{loading === card.id ? "..." : "Delete"}</motion.button>
                </>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleUnapprove(card.id)} disabled={loading === card.id}
                  style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#888", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === card.id ? 0.5 : 1 }}
                >{loading === card.id ? "..." : "Unpublish"}</motion.button>
              )}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );

  const CategoryPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {eventCategories.map(cat => (
        <motion.button key={cat} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onChange(cat)}
          style={{
            padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600",
            border: value === cat ? `1px solid ${categoryColor[cat] || "#f5a623"}` : "1px solid rgba(255,255,255,0.08)",
            backgroundColor: value === cat ? `${categoryColor[cat] || "#f5a623"}15` : "transparent",
            color: value === cat ? (categoryColor[cat] || "#f5a623") : "#555",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >{cat}</motion.button>
      ))}
    </div>
  );

  return (
    <AppLayout active="/dashboard">
      <div style={{ padding: "24px 20px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Admin</div>
              <div style={{ fontSize: "14px", color: "#444" }}>
                {pending.length} pending cards · {approved.length} live · {witnessEvents.filter(e => e.status === "pending").length} witness pending · {forecastQuestions.filter(q => q.status === "pending").length} forecast pending
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSendDigest} disabled={sendingDigest}
                style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid rgba(245,166,35,0.3)", backgroundColor: "rgba(245,166,35,0.08)", color: "#f5a623", fontSize: "13px", fontWeight: "700", cursor: sendingDigest ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: sendingDigest ? 0.6 : 1 }}
              >{sendingDigest ? "Sending..." : "📧 Send weekly digest"}</motion.button>
              {digestMsg && <div style={{ fontSize: "12px", color: "#4ade80" }}>{digestMsg}</div>}
            </div>
          </div>
        </motion.div>

        {/* Blast panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px" }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5a623", marginBottom: "16px" }}>📣 Send notification blast</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input value={blastForm.title} onChange={e => setBlastForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." style={inputStyle} />
            <input value={blastForm.body} onChange={e => setBlastForm(f => ({ ...f, body: e.target.value }))} placeholder="Notification body text..." style={inputStyle} />
            <input value={blastForm.url} onChange={e => setBlastForm(f => ({ ...f, url: e.target.value }))} placeholder="URL to open (e.g. /daily)" style={inputStyle} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleBlast} disabled={sendingBlast || !blastForm.title.trim() || !blastForm.body.trim()}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", backgroundColor: "#f5a623", color: "#000", fontSize: "13px", fontWeight: "700", cursor: sendingBlast || !blastForm.title.trim() || !blastForm.body.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: sendingBlast || !blastForm.title.trim() || !blastForm.body.trim() ? 0.5 : 1, transition: "opacity 0.2s ease" }}
              >{sendingBlast ? "Sending..." : "Send to all users"}</motion.button>
              {blastMsg && <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: "12px", color: blastMsg.startsWith("✓") ? "#4ade80" : "#f87171", fontWeight: "600" }}>{blastMsg}</motion.div>}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
          {(["pending", "approved", "create", "witness", "forecast"] as const).map(t => (
            <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: "100px", fontSize: "13px", fontWeight: "600",
                border: tab === t ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: tab === t ? "rgba(245,166,35,0.1)" : "transparent",
                color: tab === t ? "#f5a623" : "#555",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease", textTransform: "capitalize",
              }}
            >
              {t === "pending" ? `Pending (${pending.length})` : t === "approved" ? `Live (${approved.length})` : t === "witness" ? `Witness (${witnessEvents.length})` : t === "forecast" ? `Forecast (${forecastQuestions.length})` : "Create"}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Pending ── */}
          {tab === "pending" && (
            <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {renderCardList(pending)}
            </motion.div>
          )}

          {/* ── Approved ── */}
          {tab === "approved" && (
            <motion.div key="approved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {renderCardList(approved, true)}
            </motion.div>
          )}

          {/* ── Create card ── */}
          {tab === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AnimatePresence>
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "13px", fontWeight: "600", marginBottom: "20px" }}
                  >{successMsg}</motion.div>
                )}
              </AnimatePresence>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div><label style={labelStyle}>Title</label><input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="What's this issue about?" style={inputStyle} /></div>
                <div><label style={labelStyle}>Summary</label><textarea value={createForm.summary} onChange={e => setCreateForm(f => ({ ...f, summary: e.target.value }))} placeholder="2–3 sentence neutral summary." rows={3} style={{ ...inputStyle, resize: "none" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div><label style={labelStyle}>Source URL</label><input value={createForm.sourceUrl} onChange={e => setCreateForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
                  <div><label style={labelStyle}>Source Name</label><input value={createForm.sourceName} onChange={e => setCreateForm(f => ({ ...f, sourceName: e.target.value }))} placeholder="CBC, Globe and Mail..." style={inputStyle} /></div>
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {categories.map(cat => (
                      <motion.button key={cat} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setCreateForm(f => ({ ...f, category: cat }))}
                        style={{ padding: "6px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: "600", border: createForm.category === cat ? `1px solid ${categoryColor[cat]}` : "1px solid rgba(255,255,255,0.08)", backgroundColor: createForm.category === cat ? `${categoryColor[cat]}15` : "transparent", color: createForm.category === cat ? categoryColor[cat] : "#555", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >{cat}</motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Perspectives</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    {(["leftPerspective", "centrePerspective", "rightPerspective"] as const).map((key, i) => (
                      <div key={key}>
                        <div style={{ fontSize: "11px", color: "#444", marginBottom: "6px", fontWeight: "600" }}>{["Left", "Centre", "Right"][i]}</div>
                        <textarea value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))} placeholder={`${["Left", "Centre", "Right"][i]} take...`} rows={3} style={{ ...inputStyle, resize: "none", fontSize: "13px" }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Poll (optional)</label>
                  <input value={createForm.pollQuestion} onChange={e => setCreateForm(f => ({ ...f, pollQuestion: e.target.value }))} placeholder="Poll question..." style={{ ...inputStyle, marginBottom: "10px" }} />
                  {createForm.pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input value={opt} onChange={e => updatePollOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
                      {createForm.pollOptions.length > 2 && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => removePollOption(i)} style={{ padding: "0 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#555", cursor: "pointer", fontSize: "18px", fontFamily: "'DM Sans', sans-serif" }}>×</motion.button>
                      )}
                    </div>
                  ))}
                  {createForm.pollOptions.length < 5 && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={addPollOption} style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#555", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add option</motion.button>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.02, filter: "brightness(1.1)" }} whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={submitting || !createForm.title.trim() || !createForm.summary.trim()}
                  style={{ padding: "14px", borderRadius: "12px", border: "none", backgroundColor: "#f5a623", color: "#000", fontSize: "14px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting || !createForm.title.trim() || !createForm.summary.trim() ? 0.5 : 1, transition: "opacity 0.2s ease" }}
                >{submitting ? "Creating..." : "Create card"}</motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Witness ── */}
          {tab === "witness" && (
            <motion.div key="witness" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AnimatePresence>
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "13px", fontWeight: "600", marginBottom: "20px" }}
                  >{successMsg}</motion.div>
                )}
              </AnimatePresence>

              {/* Create witness form */}
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f87171", marginBottom: "16px" }}>⏳ New witness event</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div><label style={labelStyle}>Title</label><input value={witnessForm.title} onChange={e => setWitnessForm(f => ({ ...f, title: e.target.value }))} placeholder="What political decision is happening?" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Description</label><textarea value={witnessForm.description} onChange={e => setWitnessForm(f => ({ ...f, description: e.target.value }))} placeholder="2–3 sentences of context." rows={3} style={{ ...inputStyle, resize: "none" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Deadline</label>
                      <input type="datetime-local" value={witnessForm.deadlineAt} onChange={e => setWitnessForm(f => ({ ...f, deadlineAt: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Week Start (Monday)</label>
                      <input type="date" value={witnessForm.weekStart} onChange={e => setWitnessForm(f => ({ ...f, weekStart: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                  </div>
                  <div><label style={labelStyle}>Source URL (optional)</label><input value={witnessForm.sourceUrl} onChange={e => setWitnessForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
                  <div><label style={labelStyle}>Category</label><CategoryPicker value={witnessForm.category} onChange={v => setWitnessForm(f => ({ ...f, category: v }))} /></div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreateWitness}
                    disabled={submitting || !witnessForm.title.trim() || !witnessForm.deadlineAt || !witnessForm.weekStart}
                    style={{ padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "#f87171", color: "#000", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting || !witnessForm.title.trim() || !witnessForm.deadlineAt || !witnessForm.weekStart ? 0.5 : 1, transition: "opacity 0.2s ease" }}
                  >{submitting ? "Creating..." : "Create witness event"}</motion.button>
                </div>
              </div>

              {/* Pending AI-generated witness events */}
              {witnessEvents.filter(e => e.status === "pending").length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5a623", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    🤖 AI-generated — needs review ({witnessEvents.filter(e => e.status === "pending").length})
                  </div>
                  {witnessEvents.filter(e => e.status === "pending").map((event, i) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      style={{ backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}
                    >
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: categoryColor[event.category] || "#f87171", backgroundColor: `${categoryColor[event.category] || "#f87171"}15`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.category}</span>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#f5a623", backgroundColor: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>pending review</span>
                        {event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", padding: "2px 8px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "100px" }}>source ↗</a>}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", lineHeight: "1.4", marginBottom: "6px" }}>{event.title}</div>
                      <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6", marginBottom: "10px" }}>{event.description}</div>
                      <div style={{ fontSize: "11px", color: "#444", marginBottom: "14px" }}>
                        Deadline: {new Date(event.deadlineAt).toLocaleDateString("en-CA")} · Week: {event.weekStart}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleApproveWitness(event.id)} disabled={loading === event.id}
                          style={{ padding: "9px 20px", borderRadius: "10px", border: "none", backgroundColor: "#4ade80", color: "#000", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === event.id ? 0.5 : 1 }}
                        >{loading === event.id ? "..." : "✓ Approve"}</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleDeleteWitness(event.id)} disabled={loading === event.id}
                          style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === event.id ? 0.5 : 1 }}
                        >{loading === event.id ? "..." : "✗ Delete"}</motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Live witness events */}
              {witnessEvents.filter(e => e.status !== "pending").length === 0 && witnessEvents.filter(e => e.status === "pending").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#555", fontSize: "14px" }}>No witness events yet.</div>
              ) : witnessEvents.filter(e => e.status !== "pending").map((event, i) => (
                <WitnessAdminCard
                  key={event.id}
                  event={event}
                  i={i}
                  loading={loading}
                  onResolve={handleResolveWitness}
                  onDelete={handleDeleteWitness}
                  categoryColor={categoryColor}
                  inputStyle={inputStyle}
                />
              ))}
            </motion.div>
          )}

          {/* ── Forecast ── */}
          {tab === "forecast" && (
            <motion.div key="forecast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AnimatePresence>
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: "13px", fontWeight: "600", marginBottom: "20px" }}
                  >{successMsg}</motion.div>
                )}
              </AnimatePresence>

              {/* Create forecast form */}
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a78bfa", marginBottom: "16px" }}>🔮 New forecast question</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div><label style={labelStyle}>Question (Yes/No)</label><input value={forecastForm.question} onChange={e => setForecastForm(f => ({ ...f, question: e.target.value }))} placeholder="Will Doug Ford call an early election before September?" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Context</label><textarea value={forecastForm.context} onChange={e => setForecastForm(f => ({ ...f, context: e.target.value }))} placeholder="2–3 sentences of background..." rows={3} style={{ ...inputStyle, resize: "none" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Closes At</label>
                      <input type="datetime-local" value={forecastForm.closesAt} onChange={e => setForecastForm(f => ({ ...f, closesAt: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Resolves At</label>
                      <input type="datetime-local" value={forecastForm.resolvesAt} onChange={e => setForecastForm(f => ({ ...f, resolvesAt: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Week Start (Monday)</label>
                      <input type="date" value={forecastForm.weekStart} onChange={e => setForecastForm(f => ({ ...f, weekStart: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                  </div>
                  <div><label style={labelStyle}>Category</label><CategoryPicker value={forecastForm.category} onChange={v => setForecastForm(f => ({ ...f, category: v }))} /></div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreateForecast}
                    disabled={submitting || !forecastForm.question.trim() || !forecastForm.closesAt || !forecastForm.resolvesAt || !forecastForm.weekStart}
                    style={{ padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "#a78bfa", color: "#000", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: submitting || !forecastForm.question.trim() || !forecastForm.closesAt || !forecastForm.resolvesAt || !forecastForm.weekStart ? 0.5 : 1, transition: "opacity 0.2s ease" }}
                  >{submitting ? "Creating..." : "Create forecast question"}</motion.button>
                </div>
              </div>

              {/* Manual resolve modal */}
              <AnimatePresence>
                {resolveData && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                    onClick={() => setResolveData(null)}
                  >
                    <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
                      onClick={e => e.stopPropagation()}
                      style={{ backgroundColor: "#0f0f18", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: "800", color: "#f0ede6", marginBottom: "6px" }}>Manual resolve</div>
                      <div style={{ fontSize: "13px", color: "#555", marginBottom: "20px" }}>Override Gemini's resolution. This scores all existing predictions immediately.</div>
                      <div style={{ marginBottom: "14px" }}>
                        <label style={labelStyle}>Outcome</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                          {(["true", "false"] as const).map(val => (
                            <motion.button key={val} whileTap={{ scale: 0.97 }} onClick={() => setResolveData(d => d ? { ...d, outcome: val } : d)}
                              style={{ flex: 1, padding: "11px", borderRadius: "10px", border: resolveData.outcome === val ? `1px solid ${val === "true" ? "#4ade80" : "#f87171"}` : "1px solid rgba(255,255,255,0.08)", backgroundColor: resolveData.outcome === val ? (val === "true" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)") : "transparent", color: resolveData.outcome === val ? (val === "true" ? "#4ade80" : "#f87171") : "#555", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                            >{val === "true" ? "✓ Yes — happened" : "✗ No — didn't happen"}</motion.button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: "20px" }}>
                        <label style={labelStyle}>Explanation (shown to users)</label>
                        <textarea value={resolveData.explanation} onChange={e => setResolveData(d => d ? { ...d, explanation: e.target.value } : d)} placeholder="What actually happened and why..." rows={3} style={{ ...inputStyle, resize: "none" }} />
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleManualResolve}
                          disabled={resolving || !resolveData.explanation.trim()}
                          style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "#a78bfa", color: "#000", fontSize: "14px", fontWeight: "700", cursor: resolving || !resolveData.explanation.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: resolving || !resolveData.explanation.trim() ? 0.5 : 1 }}
                        >{resolving ? "Resolving..." : "Confirm resolve"}</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setResolveData(null)}
                          style={{ padding: "13px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#555", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                        >Cancel</motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pending AI-generated forecast questions */}
              {forecastQuestions.filter(q => q.status === "pending").length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5a623", marginBottom: "14px" }}>
                    🤖 AI-generated — needs review ({forecastQuestions.filter(q => q.status === "pending").length})
                  </div>
                  {forecastQuestions.filter(q => q.status === "pending").map((q, i) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      style={{ backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}
                    >
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: categoryColor[q.category] || "#a78bfa", backgroundColor: `${categoryColor[q.category] || "#a78bfa"}15`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{q.category}</span>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#f5a623", backgroundColor: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>pending review</span>
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", lineHeight: "1.4", marginBottom: "6px" }}>{q.question}</div>
                      <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6", marginBottom: "10px" }}>{q.context}</div>
                      <div style={{ fontSize: "11px", color: "#444", marginBottom: "14px" }}>
                        Closes: {new Date(q.closesAt).toLocaleDateString("en-CA")} · Resolves: {new Date(q.resolvesAt).toLocaleDateString("en-CA")} · Week: {q.weekStart}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleApproveForecast(q.id)} disabled={loading === q.id}
                          style={{ padding: "9px 20px", borderRadius: "10px", border: "none", backgroundColor: "#4ade80", color: "#000", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === q.id ? 0.5 : 1 }}
                        >{loading === q.id ? "..." : "✓ Approve"}</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleDeleteForecast(q.id)} disabled={loading === q.id}
                          style={{ padding: "9px 20px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === q.id ? 0.5 : 1 }}
                        >{loading === q.id ? "..." : "✗ Delete"}</motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Live forecast questions */}
              {forecastQuestions.filter(q => q.status !== "pending").length === 0 && forecastQuestions.filter(q => q.status === "pending").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#555", fontSize: "14px" }}>No forecast questions yet.</div>
              ) : forecastQuestions.filter(q => q.status !== "pending").map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${q.status === "resolved" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)"}`, borderRadius: "16px", padding: "20px", marginBottom: "12px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: categoryColor[q.category] || "#a78bfa", backgroundColor: `${categoryColor[q.category] || "#a78bfa"}15`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{q.category}</span>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: q.status === "resolved" ? "#4ade80" : q.status === "closed" ? "#f87171" : "#f5a623", backgroundColor: q.status === "resolved" ? "rgba(74,222,128,0.1)" : q.status === "closed" ? "rgba(248,113,113,0.1)" : "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{q.status}</span>
                        {q.outcome !== null && (
                          <span style={{ fontSize: "11px", fontWeight: "700", color: q.outcome ? "#4ade80" : "#f87171", backgroundColor: q.outcome ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", padding: "2px 8px", borderRadius: "100px" }}>{q.outcome ? "✓ Yes" : "✗ No"}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", lineHeight: "1.4", marginBottom: "6px" }}>{q.question}</div>
                      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", marginBottom: "8px" }}>{q.context}</div>
                      {q.outcomeExplanation && (
                        <div style={{ fontSize: "12px", color: "#888", backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: "8px", padding: "8px 12px" }}>{q.outcomeExplanation}</div>
                      )}
                      <div style={{ fontSize: "11px", color: "#333", marginTop: "8px" }}>
                        Closes: {new Date(q.closesAt).toLocaleDateString("en-CA")} · Resolves: {new Date(q.resolvesAt).toLocaleDateString("en-CA")} · Week: {q.weekStart}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {q.status !== "resolved" && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setResolveData({ id: q.id, outcome: "true", explanation: "" })}
                        style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(167,139,250,0.3)", backgroundColor: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >⚡ Manual resolve</motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleDeleteForecast(q.id)} disabled={loading === q.id}
                      style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.06)", color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === q.id ? 0.5 : 1 }}
                    >{loading === q.id ? "..." : "Delete"}</motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

// ── Witness card sub-component (needs local state for resolve form) ──
function WitnessAdminCard({
  event, i, loading, onResolve, onDelete, categoryColor, inputStyle,
}: {
  event: WitnessEvent;
  i: number;
  loading: string | null;
  onResolve: (id: string, outcome: string, explanation: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categoryColor: Record<string, string>;
  inputStyle: React.CSSProperties;
}) {
  const [showResolve, setShowResolve] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<"passed" | "rejected" | "delayed" | "other">("passed");
  const [resolveExplanation, setResolveExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  const outcomes = ["passed", "rejected", "delayed", "other"] as const;
  const outcomeColor: Record<string, string> = { passed: "#4ade80", rejected: "#f87171", delayed: "#f5a623", other: "#888" };

  const submit = async () => {
    if (!resolveExplanation.trim()) return;
    setSaving(true);
    await onResolve(event.id, resolveOutcome, resolveExplanation);
    setSaving(false);
    setShowResolve(false);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px", color: "#444", fontWeight: "700",
    letterSpacing: "0.06em", textTransform: "uppercase",
    marginBottom: "8px", display: "block",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${event.status === "resolved" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)"}`, borderRadius: "16px", padding: "20px", marginBottom: "12px" }}
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: categoryColor[event.category] || "#f87171", backgroundColor: `${categoryColor[event.category] || "#f87171"}15`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.category}</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color: event.status === "resolved" ? "#4ade80" : "#f5a623", backgroundColor: event.status === "resolved" ? "rgba(74,222,128,0.1)" : "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.status}</span>
        {event.outcome && (
          <span style={{ fontSize: "11px", fontWeight: "700", color: outcomeColor[event.outcome] || "#888", backgroundColor: `${outcomeColor[event.outcome] || "#888"}15`, padding: "2px 8px", borderRadius: "100px" }}>{event.outcome}</span>
        )}
      </div>
      <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", lineHeight: "1.4", marginBottom: "6px" }}>{event.title}</div>
      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", marginBottom: "8px" }}>{event.description}</div>
      {event.outcomeExplanation && (
        <div style={{ fontSize: "12px", color: "#888", backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px" }}>{event.outcomeExplanation}</div>
      )}
      <div style={{ fontSize: "11px", color: "#333", marginBottom: "12px" }}>
        Deadline: {new Date(event.deadlineAt).toLocaleDateString("en-CA")} · Week: {event.weekStart}
        {event.sourceUrl && <> · <a href={event.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#444", textDecoration: "none" }}>Source ↗</a></>}
      </div>

      {/* Inline resolve form */}
      <AnimatePresence>
        {showResolve && event.status !== "resolved" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", marginBottom: "12px" }}
          >
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Outcome</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {outcomes.map(o => (
                  <motion.button key={o} whileTap={{ scale: 0.97 }} onClick={() => setResolveOutcome(o)}
                    style={{ padding: "7px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "700", border: resolveOutcome === o ? `1px solid ${outcomeColor[o]}` : "1px solid rgba(255,255,255,0.08)", backgroundColor: resolveOutcome === o ? `${outcomeColor[o]}15` : "transparent", color: resolveOutcome === o ? outcomeColor[o] : "#555", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >{o}</motion.button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Explanation</label>
              <textarea value={resolveExplanation} onChange={e => setResolveExplanation(e.target.value)} placeholder="What actually happened..." rows={2} style={{ ...inputStyle, resize: "none", fontSize: "13px" }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving || !resolveExplanation.trim()}
                style={{ padding: "9px 18px", borderRadius: "10px", border: "none", backgroundColor: "#f87171", color: "#000", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: saving || !resolveExplanation.trim() ? 0.5 : 1 }}
              >{saving ? "Saving..." : "Confirm"}</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowResolve(false)}
                style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#555", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", gap: "8px" }}>
        {event.status !== "resolved" && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowResolve(v => !v)}
            style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.06)", color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >⚡ Resolve</motion.button>
        )}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onDelete(event.id)} disabled={loading === event.id}
          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "#555", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading === event.id ? 0.5 : 1 }}
        >{loading === event.id ? "..." : "Delete"}</motion.button>
      </div>
    </motion.div>
  );
}