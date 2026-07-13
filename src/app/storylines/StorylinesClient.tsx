"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Users } from "lucide-react";

type Chapter = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
};

type Storyline = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  category: string | null;
  updatedAt: string;
  chapters: Chapter[];
  chapterCount: number;
  latestChapter: Chapter | null;
  followers: number;
  isFollowing: boolean;
  myOpinion: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",   color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  stalled:  { label: "Stalled",  color: "#facc15", bg: "rgba(250,204,21,0.1)" },
  passed:   { label: "Passed",   color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  defeated: { label: "Defeated", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#a78bfa",
  Environment: "#34d399",
  Education: "#f59e0b",
  Healthcare: "#f87171",
  Economy: "#4ade80",
  default: "#f5a623",
};

export default function StorylinesClient({ userId }: { userId: string | null }) {
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [opinionText, setOpinionText] = useState<Record<string, string>>({});
  const [submittingOpinion, setSubmittingOpinion] = useState<string | null>(null);
  const [submittingFollow, setSubmittingFollow] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "following">("all");
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  async function fetchStorylines() {
    setLoading(true);
    try {
      const res = await fetch("/api/storylines");
      const data = await res.json();
      setStorylines(data.storylines ?? []);
    } catch {
      setStorylines([]);
    }
    setLoading(false);
  }

  // Initial data load on mount, intentional
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStorylines(); }, []);

  async function toggleFollow(storylineId: string) {
    
    if (!userId || storylineId.startsWith("seed-")) return;
    setSubmittingFollow(storylineId);
    try {
      const res = await fetch("/api/storylines/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storylineId }),
      });
      const data = await res.json();
      setStorylines(prev =>
        prev.map(s => s.id === storylineId
          ? { ...s, isFollowing: data.following, followers: s.followers + (data.following ? 1 : -1) }
          : s
        )
      );
    } catch {}
    setSubmittingFollow(null);
  }

  async function submitOpinion(storylineId: string, chapterId: string) {
    const text = opinionText[storylineId];
    if (!userId || !text?.trim()) return;
    setSubmittingOpinion(storylineId);
    try {
      await fetch("/api/storylines/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storylineId, chapterId, opinion: text }),
      });
      setStorylines(prev =>
        prev.map(s => s.id === storylineId ? { ...s, myOpinion: text } : s)
      );
      setSaved(prev => ({ ...prev, [storylineId]: true }));
      setOpinionText(prev => ({ ...prev, [storylineId]: "" }));
    } catch {}
    setSubmittingOpinion(null);
  }

  const displayed = filter === "following" ? storylines.filter(s => s.isFollowing) : storylines;

  return (
    <AppLayout active="/storylines">
      <style>{`
        .story-card { transition: border-color 0.2s ease, background-color 0.2s ease; }
        .story-card:hover { border-color: rgba(245,166,35,0.15) !important; }
      `}</style>

      <div style={{ maxWidth: "720px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Storylines</div>
          <div style={{ fontSize: "14px", color: "#444" }}>Every major Ontario issue, tracked start to now</div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["all", "following"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: "100px", fontSize: "13px", fontWeight: "600",
                border: filter === f ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: filter === f ? "rgba(245,166,35,0.12)" : "transparent",
                color: filter === f ? "#f5a623" : "#555",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
              }}
            >
              {f === "all" ? "All stories" : "Following"}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>Loading storylines...</div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: "120px", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#555", fontSize: "14px" }}>
            {filter === "following" ? "You're not following any storylines yet." : "No storylines yet."}
          </div>
        )}

        {/* Cards */}
        {!loading && displayed.map((s, i) => {
          const sc = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.active;
          const catColor = CATEGORY_COLORS[s.category ?? ""] ?? CATEGORY_COLORS.default;
          const isOpen = activeId === s.id;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="story-card"
              style={{
                backgroundColor: isOpen ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isOpen ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "18px",
                padding: "clamp(16px, 4vw, 24px)",
                marginBottom: "10px",
                boxShadow: isOpen ? "0 0 40px rgba(245,166,35,0.06)" : "none",
              }}
            >
              {/* Card top — always visible */}
              <div onClick={() => setActiveId(isOpen ? null : s.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", color: sc.color, backgroundColor: sc.bg }}>
                        {sc.label}
                      </span>
                      {s.category && (
                        <span style={{ fontSize: "11px", fontWeight: "700", color: catColor, backgroundColor: `${catColor}15`, padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          {s.category}
                        </span>
                      )}
                      <span style={{ fontSize: "11px", color: "#444" }}>{s.chapterCount} chapter{s.chapterCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", lineHeight: "1.4", letterSpacing: "-0.3px" }}>
                      {s.title}
                    </div>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ color: "#444", fontSize: "14px", flexShrink: 0, marginTop: "4px" }}
                  >↓</motion.span>
                </div>

                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6", marginBottom: "12px" }}>
                  {s.summary}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#444", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Users size={13} />{s.followers} following</span>
                  {s.myOpinion && <span style={{ color: "#f5a623" }}>✓ You logged a take</span>}
                  {s.isFollowing && <span style={{ color: "#4ade80" }}>✓ Following</span>}
                  {s.latestChapter && (
                    <span>Latest: {new Date(s.latestChapter.publishedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

                      {/* Timeline */}
                      <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5a623", marginBottom: "16px" }}>
                        How it unfolded
                      </div>
                      <div style={{ position: "relative", paddingLeft: "20px", marginBottom: "24px" }}>
                        <div style={{ position: "absolute", left: "6px", top: 0, bottom: 0, width: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                        {s.chapters.map((ch, idx) => (
                          <div key={ch.id} style={{ position: "relative", marginBottom: "20px" }}>
                            <div style={{
                              position: "absolute", left: "-17px", top: "5px",
                              width: "8px", height: "8px", borderRadius: "50%",
                              backgroundColor: idx === s.chapters.length - 1 ? "#f5a623" : "rgba(255,255,255,0.15)",
                              border: idx === s.chapters.length - 1 ? "2px solid rgba(245,166,35,0.3)" : "none",
                            }} />
                            <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px" }}>
                              {new Date(ch.publishedAt).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#ccc", marginBottom: "4px", lineHeight: "1.4" }}>{ch.title}</div>
                            <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>{ch.summary}</div>
                          </div>
                        ))}
                      </div>

                      {/* Your take */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>Your take</div>

                        {saved[s.id] || s.myOpinion ? (
                          <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.12)", fontSize: "13px", color: "#ccc", lineHeight: "1.6", fontStyle: "italic" }}>
                            &quot;{saved[s.id] ? opinionText[s.id] || s.myOpinion : s.myOpinion}&quot;
                          </div>
                        ) : userId ? (
                          <div>
                            <textarea
                              value={opinionText[s.id] ?? ""}
                              onChange={e => setOpinionText(prev => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="What's your take on where this is headed?"
                              rows={2}
                              style={{
                                width: "100%", padding: "12px 14px",
                                backgroundColor: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "10px", color: "#ccc",
                                fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                                resize: "none", outline: "none",
                                boxSizing: "border-box", lineHeight: "1.6",
                                marginBottom: "10px",
                              }}
                            />
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => submitOpinion(s.id, s.latestChapter?.id ?? "")}
                              disabled={!opinionText[s.id]?.trim() || submittingOpinion === s.id}
                              style={{
                                padding: "9px 20px", borderRadius: "9px", border: "none",
                                backgroundColor: opinionText[s.id]?.trim() ? "#f5a623" : "rgba(255,255,255,0.05)",
                                color: opinionText[s.id]?.trim() ? "#000" : "#333",
                                fontSize: "13px", fontWeight: "700",
                                cursor: opinionText[s.id]?.trim() ? "pointer" : "not-allowed",
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {submittingOpinion === s.id ? "Saving..." : "Log your take"}
                            </motion.button>
                          </div>
                        ) : (
                          <div style={{ fontSize: "13px", color: "#444" }}>Sign in to log your take.</div>
                        )}
                      </div>

                      {/* Follow button */}
                      {userId && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleFollow(s.id)}
                          disabled={submittingFollow === s.id}
                          style={{
                            padding: "9px 20px", borderRadius: "9px",
                            border: s.isFollowing ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: s.isFollowing ? "rgba(245,166,35,0.08)" : "transparent",
                            color: s.isFollowing ? "#f5a623" : "#555",
                            fontSize: "13px", fontWeight: "700",
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {submittingFollow === s.id ? "..." : s.isFollowing ? "✓ Following" : "Follow this story"}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
}

