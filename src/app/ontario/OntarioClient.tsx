"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

function getLabel(x: number, y: number) {
  if (x < -0.15 && y < -0.15) return { label: "Left Libertarian", color: "#4ade80" };
  if (x < -0.15 && y >= -0.15) return { label: "Left Leaning", color: "#60a5fa" };
  if (x > 0.15 && y < -0.15) return { label: "Right Libertarian", color: "#f59e0b" };
  if (x > 0.15 && y >= -0.15) return { label: "Right Leaning", color: "#f87171" };
  if (x < -0.05) return { label: "Centre Left", color: "#818cf8" };
  if (x > 0.05) return { label: "Centre Right", color: "#fb923c" };
  return { label: "Centrist", color: "#a78bfa" };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function StatBox({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "16px 14px", borderRadius: "14px",
        backgroundColor: `${color}08`, border: `1px solid ${color}18`,
        display: "flex", flexDirection: "column", gap: "4px",
      }}
    >
      <div style={{ fontSize: "20px" }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: "800", color, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#444", fontWeight: "600" }}>{label}</div>
    </motion.div>
  );
}

type OntarioData = {
  user: {
    username: string | null;
    compassPosition: { x: number; y: number } | null;
    streakCount: number;
    createdAt: string;
  };
  xp: number;
  actionCounts: Record<string, number>;
  opinions: { id: string; opinion: string; createdAt: string }[];
  pollsVoted: number;
  modulesCompleted: number;
  predictions: {
    id: string; prediction: boolean; confidence: number;
    pointsEarned: number | null; question: string;
    status: string; outcome: boolean | null; createdAt: string;
  }[];
  forecastCorrect: number;
  forecastTotal: number;
  watches: { id: string; title: string; status: string; category: string; watchedAt: string }[];
  joinedCircles: { id: string; title: string; emoji: string; category: string; slug: string; leaning: string | null }[];
  followedStorylines: { id: string; title: string; status: string; category: string; slug: string }[];
  bookmarksCount: number;
  topCategory: string | null;
};

const LEANING_COLORS: Record<string, string> = {
  left: "#60a5fa", centre: "#a78bfa", right: "#f87171",
};

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  witness_watch:    { label: "Events watched",     icon: "⏳", color: "#f87171" },
  forecast_predict: { label: "Forecasts made",     icon: "🔮", color: "#a78bfa" },
  poll_vote:        { label: "Polls voted",         icon: "🗳️", color: "#60a5fa" },
  learn_complete:   { label: "Modules completed",   icon: "📚", color: "#4ade80" },
  opinion_submit:   { label: "Opinions logged",     icon: "💬", color: "#818cf8" },
  bookmark:         { label: "Items bookmarked",    icon: "🔖", color: "#f5a623" },
  swipe:            { label: "Cards swiped",        icon: "⚡", color: "#34d399" },
};

export default function OntarioClient() {
  const [data, setData] = useState<OntarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "forecast" | "activity">("overview");

  useEffect(() => {
    fetch("/api/ontario")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const compass = data?.user?.compassPosition ?? null;
  const skipped = !compass || (compass.x === 0 && compass.y === 0);
  const { label: compassLabel, color: compassColor } = compass && !skipped
    ? getLabel(compass.x, compass.y)
    : { label: "Not taken yet", color: "#555" };

  const joinedDate = data?.user?.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString("en-CA", { month: "long", year: "numeric" })
    : "";

  const forecastAccuracy = data && data.forecastTotal > 0
    ? Math.round((data.forecastCorrect / data.forecastTotal) * 100)
    : null;

  const totalActions = data
    ? (data.modulesCompleted + data.pollsVoted + data.opinions.length +
       (data.actionCounts.witness_watch ?? 0) + (data.actionCounts.forecast_predict ?? 0))
    : 0;

  const tabs = ["overview", "forecast", "activity"] as const;

  return (
    <AppLayout active="/ontario">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ont-tab { transition: all 0.15s ease; }
        .ont-card { transition: border-color 0.2s ease; }
        .ont-card:hover { border-color: rgba(255,255,255,0.1) !important; }
        input::placeholder, textarea::placeholder { color: #333; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ padding: "24px 20px 100px", maxWidth: "780px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>My Ontario</div>
          <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "4px" }}>
            Your Political Footprint
          </div>
          <div style={{ fontSize: "14px", color: "#444" }}>
            {loading ? "Loading your civic story..." : `${totalActions} civic actions${joinedDate ? ` · Joined ${joinedDate}` : ""}`}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: "100px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : !data ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>Could not load your Ontario profile.</div>
        ) : (
          <>
            {/* Identity card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
              style={{
                background: skipped
                  ? "rgba(255,255,255,0.02)"
                  : `linear-gradient(135deg, ${compassColor}10 0%, rgba(255,255,255,0.01) 100%)`,
                border: `1px solid ${skipped ? "rgba(255,255,255,0.06)" : compassColor + "30"}`,
                borderRadius: "20px", padding: "24px", marginBottom: "12px",
                position: "relative", overflow: "hidden",
              }}
            >
              {!skipped && (
                <div style={{
                  position: "absolute", top: "-40px", right: "-40px",
                  width: "160px", height: "160px", borderRadius: "50%",
                  background: `radial-gradient(circle, ${compassColor}15 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Political Identity</div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: skipped ? "#333" : compassColor, letterSpacing: "-0.5px" }}>
                    {skipped ? "Not taken yet" : compassLabel}
                  </div>
                  <div style={{ fontSize: "13px", color: "#444", marginTop: "4px" }}>
                    {skipped ? "Take the quiz to discover where you stand" : "Based on your Ontario political compass quiz"}
                  </div>
                </div>
                {skipped ? (
                  <Link href="/onboarding" style={{ padding: "10px 20px", borderRadius: "12px", backgroundColor: "#f5a623", color: "#000", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
                    Take quiz →
                  </Link>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: compassColor }} />
                    <span style={{ fontSize: "12px", color: "#555", fontWeight: "600" }}>
                      {compass && compass.x < 0 ? "Economic left" : "Economic right"} · {compass && compass.y < 0 ? "Libertarian" : "Authoritarian"}
                    </span>
                  </div>
                )}
              </div>

              {/* XP bar */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#444", fontWeight: "700" }}>CIVIC XP</span>
                  <span style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700" }}>{data.xp} pts</span>
                </div>
                <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "100px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (data.xp / 500) * 100)}%` }}
                    transition={{ duration: 1, ease, delay: 0.3 }}
                    style={{ height: "100%", backgroundColor: "#f5a623", borderRadius: "100px" }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#333", marginTop: "4px" }}>
                  {data.xp < 50 ? "Just starting" : data.xp < 150 ? "Getting engaged" : data.xp < 300 ? "Informed citizen" : data.xp < 500 ? "Political junkie" : "Civic champion"}
                  {data.xp < 500 && ` · ${500 - data.xp} pts to next level`}
                </div>
              </div>
            </motion.div>

            {/* Stat grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35, ease }}
              style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}
            >
              <StatBox icon="🔥" value={data.user.streakCount} label="Day streak" color="#f5a623" />
              <StatBox icon="📚" value={data.modulesCompleted} label="Modules done" color="#4ade80" />
              <StatBox icon="🗳️" value={data.pollsVoted} label="Polls voted" color="#60a5fa" />
              <StatBox icon="🔖" value={data.bookmarksCount} label="Bookmarked" color="#fb923c" />
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              style={{ display: "flex", gap: "6px", marginBottom: "16px" }}
            >
              {tabs.map(t => (
                <button
                  key={t}
                  className="ont-tab"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "7px 16px", borderRadius: "100px",
                    fontSize: "12px", fontWeight: "700",
                    border: tab === t ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: tab === t ? "rgba(245,166,35,0.12)" : "transparent",
                    color: tab === t ? "#f5a623" : "#444",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t === "overview" ? "Overview" : t === "forecast" ? "🔮 Forecast" : "⚡ Activity"}
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">

              {/* OVERVIEW TAB */}
              {tab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  {/* Circles */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Circles Joined</div>
                    {data.joinedCircles.length === 0 ? (
                      <div style={{ padding: "20px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", color: "#333" }}>No circles yet.</div>
                        <Link href="/circles" style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "700", textDecoration: "none" }}>Explore Circles →</Link>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.joinedCircles.map((c, i) => (
                          <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <Link href={`/circles`} style={{ textDecoration: "none" }}>
                              <div className="ont-card" style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 16px", borderRadius: "12px",
                                backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                cursor: "pointer",
                              }}>
                                <span style={{ fontSize: "20px" }}>{c.emoji}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ccc" }}>{c.title}</div>
                                  <div style={{ fontSize: "11px", color: "#444" }}>{c.category}</div>
                                </div>
                                {c.leaning && (
                                  <span style={{
                                    fontSize: "10px", fontWeight: "700",
                                    color: LEANING_COLORS[c.leaning] ?? "#888",
                                    backgroundColor: `${LEANING_COLORS[c.leaning] ?? "#888"}12`,
                                    padding: "2px 8px", borderRadius: "100px",
                                  }}>
                                    {c.leaning}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Storylines */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Storylines Following</div>
                    {data.followedStorylines.length === 0 ? (
                      <div style={{ padding: "20px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", color: "#333" }}>No storylines followed yet.</div>
                        <Link href="/storylines" style={{ fontSize: "12px", color: "#fb923c", fontWeight: "700", textDecoration: "none" }}>Browse Storylines →</Link>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.followedStorylines.map((s, i) => {
                          const statusColor = s.status === "active" ? "#4ade80" : s.status === "passed" ? "#60a5fa" : "#f87171";
                          return (
                            <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                              <div className="ont-card" style={{ padding: "12px 16px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
                                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ccc", flex: 1 }}>{s.title}</div>
                                  <span style={{ fontSize: "10px", color: statusColor, fontWeight: "700", textTransform: "uppercase" }}>{s.status}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent opinions */}
                  {data.opinions.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Recent Opinions</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.opinions.slice(0, 3).map((op, i) => (
                          <motion.div key={op.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ padding: "12px 16px", borderRadius: "12px", backgroundColor: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.1)" }}
                          >
                            <div style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.6", marginBottom: "6px" }}>&quot;{op.opinion}&quot;</div>
                            <div style={{ fontSize: "11px", color: "#333" }}>{timeAgo(op.createdAt)}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top category */}
                  {data.topCategory && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                      style={{ padding: "16px", borderRadius: "14px", backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", marginBottom: "12px" }}
                    >
                      <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Your Most Engaged Topic</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#f0ede6" }}>{data.topCategory}</div>
                      <div style={{ fontSize: "12px", color: "#444", marginTop: "2px" }}>Based on your activity across the app</div>
                    </motion.div>
                  )}

                </motion.div>
              )}

              {/* FORECAST TAB */}
              {tab === "forecast" && (
                <motion.div key="forecast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  {/* Accuracy card */}
                  <div style={{
                    padding: "20px", borderRadius: "16px", marginBottom: "16px",
                    background: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(167,139,250,0.2)",
                  }}>
                    <div style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Forecast Record</div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "32px", fontWeight: "800", color: "#a78bfa", letterSpacing: "-1px" }}>
                          {forecastAccuracy !== null ? `${forecastAccuracy}%` : "—"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#555" }}>accuracy</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "32px", fontWeight: "800", color: "#f0ede6", letterSpacing: "-1px" }}>{data.forecastCorrect}/{data.forecastTotal}</div>
                        <div style={{ fontSize: "12px", color: "#555" }}>resolved correct</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "32px", fontWeight: "800", color: "#f5a623", letterSpacing: "-1px" }}>
                          {data.predictions.reduce((s, p) => s + (p.pointsEarned ?? 0), 0)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#555" }}>points earned</div>
                      </div>
                    </div>
                  </div>

                  {data.predictions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#333", fontSize: "14px" }}>
                      No predictions yet. <Link href="/forecast" style={{ color: "#a78bfa", fontWeight: "700", textDecoration: "none" }}>Make your first →</Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {data.predictions.map((p, i) => {
                        const resolved = p.status === "resolved";
                        const correct = resolved && p.outcome === p.prediction;
                        const wrong = resolved && p.outcome !== p.prediction;
                        const borderColor = correct ? "rgba(74,222,128,0.2)" : wrong ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)";
                        const dotColor = correct ? "#4ade80" : wrong ? "#f87171" : "#555";
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${borderColor}` }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: dotColor, marginTop: "5px", flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#ccc", lineHeight: "1.5", marginBottom: "6px" }}>{p.question}</div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                  <span style={{ fontSize: "11px", fontWeight: "700", color: p.prediction ? "#4ade80" : "#f87171", backgroundColor: p.prediction ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                                    You: {p.prediction ? "YES" : "NO"}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#555" }}>{p.confidence}% confidence</span>
                                  {resolved && (
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: correct ? "#4ade80" : "#f87171" }}>
                                      {correct ? `✓ Correct · +${p.pointsEarned ?? p.confidence} pts` : "✗ Wrong"}
                                    </span>
                                  )}
                                  {!resolved && (
                                    <span style={{ fontSize: "11px", color: "#555", fontWeight: "600" }}>Pending</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ACTIVITY TAB */}
              {tab === "activity" && (
                <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  {/* Activity breakdown */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>What You&apos;ve Done</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {Object.entries(ACTION_LABELS).map(([action, cfg]) => {
                        const count = action === "poll_vote" ? data.pollsVoted
                          : action === "learn_complete" ? data.modulesCompleted
                          : action === "opinion_submit" ? data.opinions.length
                          : data.actionCounts[action] ?? 0;
                        if (count === 0) return null;
                        return (
                          <motion.div key={action} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <span style={{ fontSize: "18px" }}>{cfg.icon}</span>
                            <div style={{ flex: 1, fontSize: "13px", color: "#aaa", fontWeight: "600" }}>{cfg.label}</div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: cfg.color }}>{count}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Witness events */}
                  {data.watches.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Events You Watched</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.watches.map((w, i) => (
                          <motion.div key={w.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ padding: "12px 16px", borderRadius: "12px", backgroundColor: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.1)" }}
                          >
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#ccc", marginBottom: "4px" }}>{w.title}</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <span style={{ fontSize: "11px", color: "#f87171", fontWeight: "700" }}>{w.category}</span>
                              <span style={{ fontSize: "11px", color: w.status === "resolved" ? "#4ade80" : "#f5a623", fontWeight: "700", textTransform: "uppercase" }}>{w.status}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalActions === 0 && (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}>
                      No activity yet. Start by reading the feed, voting on a poll, or joining a circle.
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </div>
    </AppLayout>
  );
}

