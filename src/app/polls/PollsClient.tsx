"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const CATEGORY_COLORS: Record<string, string> = {
  housing: "#60a5fa",
  education: "#a78bfa",
  healthcare: "#34d399",
  environment: "#4ade80",
  economy: "#fbbf24",
  transit: "#f472b6",
  default: "#f5a623",
};

function getLeaningLabel(x: number, y: number) {
  if (x < -0.1) return "Left";
  if (x > 0.1) return "Right";
  return "Centre";
}

export default function PollsClient({
  polls, voteCounts, userVotes, userId, compassPosition,
}: {
  polls: any[];
  voteCounts: any[];
  userVotes: { pollId: string; optionIndex: number }[];
  userId: string | null;
  compassPosition: { x: number; y: number };
}) {
  const [voted, setVoted] = useState<Record<string, number>>(
    Object.fromEntries(userVotes.map((v) => [v.pollId, v.optionIndex]))
  );
  const [optimisticCounts, setOptimisticCounts] = useState<any[]>(voteCounts);
  const [loading, setLoading] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState<string | null>(null);
  
  const getOptionsWithCounts = (pollId: string, options: string[]) => {
    return options.map((opt: string, idx: number) => {
      const relevant = optimisticCounts.filter((c) => c.pollId === pollId && c.optionIndex === idx);
      const total = relevant.reduce((sum: number, c: any) => sum + Number(c.count), 0);
      const byLeaning = { Left: 0, Centre: 0, Right: 0 } as Record<string, number>;
      relevant.forEach((c: any) => {
        const l = c.leaning || "Centre";
        byLeaning[l] = (byLeaning[l] || 0) + Number(c.count);
      });
      return { label: opt, total, byLeaning };
    });
  };

  const getTotalVotes = (pollId: string) =>
    optimisticCounts.filter((c) => c.pollId === pollId).reduce((sum, c) => sum + Number(c.count), 0);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!userId || voted[pollId] !== undefined || loading) return;
    setLoading(pollId);
    const leaning = getLeaningLabel(compassPosition.x, compassPosition.y);
    setVoted((prev) => ({ ...prev, [pollId]: optionIndex }));
    setOptimisticCounts((prev) => [
      ...prev,
      { pollId, optionIndex, count: 1, leaning },
    ]);
    try {
      await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionIndex }),
      });
      setJustVoted(pollId);
      setTimeout(() => setJustVoted(null), 4000);
    } catch {}
    setLoading(null);
  };

  return (
    <AppLayout active="/polls">
      <div style={{ padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 48px)", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>Polls</div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ fontSize: "14px", color: "#444", marginBottom: "36px" }}>
          Vote on real issues. See how other Ontario Gen Z feels.
        </motion.div>

        {polls.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#333", fontSize: "15px" }}>
            No polls yet. Check back soon.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {polls.map((poll, i) => {
              const options = getOptionsWithCounts(poll.id, poll.options as string[]);
              const totalVotes = getTotalVotes(poll.id);
              const hasVoted = voted[poll.id] !== undefined;
              const catColor = CATEGORY_COLORS[poll.cardCategory?.toLowerCase()] || CATEGORY_COLORS.default;
              const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "20px",
                    padding: "28px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {poll.cardCategory && (
                    <span style={{
                      fontSize: "11px", fontWeight: "700", color: catColor,
                      backgroundColor: `${catColor}15`, padding: "3px 10px",
                      borderRadius: "100px", letterSpacing: "0.05em",
                      textTransform: "uppercase", display: "inline-block", marginBottom: "14px",
                    }}>
                      {poll.cardCategory}
                    </span>
                  )}

                  {poll.cardTitle && (
                    <div style={{ fontSize: "12px", color: "#444", marginBottom: "8px", fontWeight: "500" }}>
                      Re: {poll.cardTitle}
                    </div>
                  )}

                  <div style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "-0.3px", marginBottom: "24px", lineHeight: "1.4" }}>
                    {poll.question}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {options.map((opt, idx) => {
                      const pct = totalVotes > 0 ? Math.round((opt.total / totalVotes) * 100) : 0;
                      const isMyVote = voted[poll.id] === idx;

                      return (
                        <motion.button
                          key={idx}
                          whileHover={!hasVoted && !isExpired ? { scale: 1.01 } : {}}
                          whileTap={!hasVoted && !isExpired ? { scale: 0.99 } : {}}
                          onClick={() => !isExpired && handleVote(poll.id, idx)}
                          style={{
                            position: "relative",
                            padding: "14px 18px",
                            borderRadius: "12px",
                            border: isMyVote
                              ? `1px solid ${catColor}60`
                              : "1px solid rgba(255,255,255,0.06)",
                            backgroundColor: isMyVote
                              ? `${catColor}10`
                              : hasVoted ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
                            cursor: hasVoted || isExpired ? "default" : "pointer",
                            textAlign: "left",
                            fontFamily: "'DM Sans', sans-serif",
                            overflow: "hidden",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {hasVoted && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              style={{
                                position: "absolute", left: 0, top: 0, bottom: 0,
                                backgroundColor: isMyVote ? `${catColor}18` : "rgba(255,255,255,0.03)",
                                borderRadius: "12px",
                              }}
                            />
                          )}
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {isMyVote && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  style={{
                                    width: "18px", height: "18px", borderRadius: "50%",
                                    backgroundColor: catColor, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    fontSize: "10px", flexShrink: 0,
                                  }}
                                >✓</motion.div>
                              )}
                              <span style={{
                                fontSize: "14px", fontWeight: hasVoted ? "600" : "500",
                                color: hasVoted ? "#ccc" : "#999",
                              }}>{opt.label}</span>
                            </div>
                            {hasVoted && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{ fontSize: "14px", fontWeight: "700", color: isMyVote ? catColor : "#555", flexShrink: 0 }}
                              >{pct}%</motion.span>
                            )}
                          </div>

                          {hasVoted && (opt.byLeaning.Left > 0 || opt.byLeaning.Right > 0 || opt.byLeaning.Centre > 0) && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              style={{ position: "relative", marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}
                              >
                              {[
                                { key: "Left", color: "#60a5fa" },
                                { key: "Centre", color: "#a78bfa" },
                                { key: "Right", color: "#f87171" },
                              ].map(({ key, color }) =>
                                opt.byLeaning[key] > 0 ? (
                                  <span key={key} style={{
                                    fontSize: "11px", fontWeight: "700",
                                    color, backgroundColor: `${color}15`,
                                    padding: "3px 10px", borderRadius: "100px",
                                    border: `1px solid ${color}25`,
                                  }}>
                                    {key} · {opt.byLeaning[key]}
                                  </span>
                                ) : null
                              )}
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                    <AnimatePresence>
                    {justVoted === poll.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        style={{
                          marginTop: "14px", padding: "12px 16px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(245,166,35,0.06)",
                          border: "1px solid rgba(245,166,35,0.15)",
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between", gap: "12px",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#888" }}>See how Ontario thinks?</span>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: "Civiq Poll",
                                text: `I just voted on "${poll.question}" on Civiq. Check it out:`,
                                url: "https://civiq-sooty.vercel.app/polls",
                              }).catch(() => {});
                            }
                          }}
                          style={{
                            backgroundColor: "#f5a623", color: "#000",
                            border: "none", borderRadius: "8px",
                            padding: "6px 14px", fontSize: "12px",
                            fontWeight: "700", cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            flexShrink: 0,
                          }}
                        >
                          Share 🔗
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#333", fontWeight: "500" }}>
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </span>
                    {isExpired && (
                      <span style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Closed
                      </span>
                    )}
                    {!hasVoted && !isExpired && !userId && (
                      <span style={{ fontSize: "12px", color: "#444" }}>Sign in to vote</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}