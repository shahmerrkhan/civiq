"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  housing: "#60a5fa", education: "#a78bfa", healthcare: "#34d399",
  environment: "#4ade80", economy: "#fbbf24", transit: "#f472b6", default: "#f5a623",
};

const PERSPECTIVE_CONFIG = [
  { key: "left", label: "Left", color: "#60a5fa", icon: "◀" },
  { key: "centre", label: "Centre", color: "#a78bfa", icon: "◆" },
  { key: "right", label: "Right", color: "#f87171", icon: "▶" },
];

export type IssueCard = {
  id: string;
  category: string | null;
  title: string;
  summary: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  perspectives: Record<string, string> | null;
};

export type PollVote = {
  pollId: string;
  optionIndex: number;
  userLeaning?: string | null;
};

export type IssuePoll = {
  id: string;
  question: string;
  options: unknown;
  votes: PollVote[];
};

export default function IssueClient({ card, polls, userVotes, userOpinion, userId, compassPosition }: {
  card: IssueCard;
  polls: IssuePoll[];
  userVotes: { pollId: string; optionIndex: number }[];
  userOpinion: string | null;
  userId: string | null;
  compassPosition: { x: number; y: number };
}) {
  const [voted, setVoted] = useState<Record<string, number>>(
    Object.fromEntries(userVotes.map((v) => [v.pollId, v.optionIndex]))
  );
  const [optimisticVotes, setOptimisticVotes] = useState<PollVote[]>(
    polls.flatMap((p) => p.votes)
  );
  const [opinion, setOpinion] = useState(userOpinion ?? "");
  const [opinionSaved, setOpinionSaved] = useState(!!userOpinion);
  const [savingOpinion, setSavingOpinion] = useState(false);
  const [activePerspective, setActivePerspective] = useState("left");

  const catColor = CATEGORY_COLORS[card.category?.toLowerCase() ?? "default"] || CATEGORY_COLORS.default;
  const perspectives = card.perspectives as Record<string, string> | null;

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!userId || voted[pollId] !== undefined) return;
    const leaning = compassPosition.x < -0.1 ? "Left" : compassPosition.x > 0.1 ? "Right" : "Centre";
    setVoted((prev) => ({ ...prev, [pollId]: optionIndex }));
    setOptimisticVotes((prev) => [...prev, { pollId, optionIndex, userLeaning: leaning }]);
    await fetch("/api/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionIndex }),
    });
  };

  const handleSaveOpinion = async () => {
    if (!userId || !opinion.trim()) return;
    setSavingOpinion(true);
    await fetch("/api/opinions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, opinion }),
    });
    setSavingOpinion(false);
    setOpinionSaved(true);
  };

  return (
    <AppLayout active="/dashboard">
      <div style={{ padding: "40px 48px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#444", textDecoration: "none", marginBottom: "28px", fontWeight: "600" }}>
            ← Back to feed
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {card.category && (
            <span style={{
              fontSize: "11px", fontWeight: "700", color: catColor,
              backgroundColor: `${catColor}15`, padding: "3px 10px",
              borderRadius: "100px", letterSpacing: "0.05em",
              textTransform: "uppercase", display: "inline-block", marginBottom: "16px",
            }}>{card.category}</span>
          )}
          <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: "800", letterSpacing: "-1px", lineHeight: "1.2", margin: "0 0 16px" }}>
            {card.title}
          </h1>
          <p style={{ fontSize: "16px", color: "#666", lineHeight: "1.8", margin: "0 0 8px" }}>
            {card.summary}
          </p>
          {card.sourceName && card.sourceUrl && (
            <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#444", textDecoration: "none", fontWeight: "600" }}>
              Source: {card.sourceName} ↗
            </a>
          )}
        </motion.div>

        {/* Perspectives */}
        {perspectives && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} style={{ marginTop: "36px" }}>
            <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
              Perspectives
            </div>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {PERSPECTIVE_CONFIG.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setActivePerspective(key)}
                  style={{
                    padding: "8px 18px", borderRadius: "10px", border: "none",
                    backgroundColor: activePerspective === key ? `${color}20` : "rgba(255,255,255,0.03)",
                    color: activePerspective === key ? color : "#444",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s ease",
                    outline: activePerspective === key ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{label}</button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {PERSPECTIVE_CONFIG.map(({ key, color }) =>
                activePerspective === key && perspectives[key] ? (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      backgroundColor: `${color}08`,
                      border: `1px solid ${color}20`,
                      borderRadius: "16px", padding: "22px 24px",
                      fontSize: "15px", color: "#888", lineHeight: "1.8",
                    }}
                  >
                    {perspectives[key]}
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Polls */}
        {polls.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} style={{ marginTop: "36px" }}>
            <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
              What do you think?
            </div>
            {polls.map((poll) => {
              const options = poll.options as string[];
              const allVotes = optimisticVotes.filter((v) => v.pollId === poll.id);
              const totalVotes = allVotes.length;
              const hasVoted = voted[poll.id] !== undefined;

              return (
                <div key={poll.id} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "18px", letterSpacing: "-0.2px" }}>{poll.question}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {options.map((opt, idx) => {
                      const count = allVotes.filter((v) => v.optionIndex === idx).length;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isMyVote = voted[poll.id] === idx;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={!hasVoted ? { scale: 1.01 } : {}}
                          whileTap={!hasVoted ? { scale: 0.99 } : {}}
                          onClick={() => handleVote(poll.id, idx)}
                          style={{
                            position: "relative", padding: "13px 18px", borderRadius: "12px",
                            border: isMyVote ? `1px solid ${catColor}60` : "1px solid rgba(255,255,255,0.06)",
                            backgroundColor: isMyVote ? `${catColor}10` : "rgba(255,255,255,0.02)",
                            cursor: hasVoted ? "default" : "pointer",
                            textAlign: "left", fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {hasVoted && (
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              style={{ position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: isMyVote ? `${catColor}18` : "rgba(255,255,255,0.03)", borderRadius: "12px" }}
                            />
                          )}
                          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", fontWeight: "600", color: hasVoted ? "#ccc" : "#999" }}>{opt}</span>
                            {hasVoted && <span style={{ fontSize: "14px", fontWeight: "700", color: isMyVote ? catColor : "#555" }}>{pct}%</span>}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "#555" }}>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Opinion */}
        {userId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} style={{ marginTop: "36px" }}>
            <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
              Log your take
            </div>
            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px" }}>
              <textarea
                value={opinion}
                onChange={(e) => { setOpinion(e.target.value); setOpinionSaved(false); }}
                placeholder="What do you actually think about this? This gets saved to your profile so you can track how your views evolve over time."
                rows={4}
                style={{
                  width: "100%", backgroundColor: "transparent", border: "none", outline: "none",
                  color: "#ccc", fontSize: "14px", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif",
                  resize: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSaveOpinion}
                  disabled={savingOpinion || !opinion.trim()}
                  style={{
                    padding: "10px 24px", borderRadius: "10px", border: "none",
                    backgroundColor: opinionSaved ? "rgba(74,222,128,0.15)" : "#f5a623",
                    color: opinionSaved ? "#4ade80" : "#000",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease",
                  }}
                >
                  {opinionSaved ? "✓ Saved" : savingOpinion ? "Saving..." : "Save take"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

