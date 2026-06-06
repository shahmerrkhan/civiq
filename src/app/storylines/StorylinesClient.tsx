"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

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
  active:   { label: "Active",   color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
  stalled:  { label: "Stalled",  color: "#facc15", bg: "rgba(250,204,21,0.08)" },
  passed:   { label: "Passed",   color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  defeated: { label: "Defeated", color: "#f87171", bg: "rgba(248,113,113,0.08)" },
};

const SEED_STORYLINES = [
  {
    title: "Ontario's Municipal Zoning Overhaul",
    slug: "municipal-zoning-bill-185",
    summary: "Bill 185 gives developers power to bypass local planning rules to hit the 1.5M homes target. Ongoing.",
    status: "active",
    category: "Housing",
    chapters: [
      { title: "Bill introduced at Queen's Park", summary: "The Ford government tabled Bill 185, allowing developers to override municipal zoning in select areas to accelerate housing construction.", publishedAt: "2024-04-10" },
      { title: "Municipal backlash grows", summary: "Toronto, Ottawa, and Hamilton councils passed motions opposing the bill, citing loss of local democratic control over land use decisions.", publishedAt: "2024-05-02" },
      { title: "Bill passes third reading", summary: "Bill 185 passed with the PC majority despite opposition from all three other parties. Municipalities now have 90 days to comply.", publishedAt: "2024-06-14" },
      { title: "First legal challenge filed", summary: "A coalition of neighbourhood associations filed for judicial review, arguing the bill violates constitutional protections for municipal governance.", publishedAt: "2024-09-03" },
    ],
  },
  {
    title: "Ontario Greenbelt Controversy",
    slug: "greenbelt-controversy",
    summary: "The Ford government's attempt to open Greenbelt land for development triggered auditor criticism, reversals, and ongoing political fallout.",
    status: "active",
    category: "Environment",
    chapters: [
      { title: "Government announces Greenbelt removals", summary: "Housing Minister Steve Clark announced 7,400 acres of Greenbelt land would be opened for housing development, benefiting a small group of developers.", publishedAt: "2022-11-04" },
      { title: "Auditor General's damning report", summary: "Ontario's Auditor General found the selection process for removed land was secretive, favoured developers with government connections, and lacked proper justification.", publishedAt: "2023-08-09" },
      { title: "Government reverses course", summary: "Under significant public pressure and after Steve Clark's resignation, Premier Ford reversed all Greenbelt removals and promised a new transparent process.", publishedAt: "2023-09-21" },
      { title: "RCMP investigation launched", summary: "The RCMP announced a criminal investigation into the Greenbelt decision-making process, marking a rare federal intervention in provincial housing policy.", publishedAt: "2024-01-16" },
    ],
  },
  {
    title: "Ontario Education Funding Cuts",
    slug: "education-funding-cuts",
    summary: "Ongoing dispute between the Ford government and teachers' unions over classroom sizes, funding cuts, and working conditions.",
    status: "stalled",
    category: "Education",
    chapters: [
      { title: "Government proposes increased class sizes", summary: "The Ford government proposed increasing average high school class sizes from 22 to 28, which would eliminate roughly 3,500 teaching positions.", publishedAt: "2019-03-15" },
      { title: "Province-wide teacher strikes begin", summary: "All four major teachers' unions launched coordinated work-to-rule campaigns and rotating strikes, affecting hundreds of thousands of students.", publishedAt: "2020-01-08" },
      { title: "COVID disrupts negotiations", summary: "The pandemic forced a temporary halt to labour disputes as schools shifted to remote learning, pushing funding and class size disputes to the background.", publishedAt: "2020-03-17" },
      { title: "New contracts reached — tensions remain", summary: "After years of conflict, contracts were settled but teachers report chronic underfunding in classrooms has not been addressed. Dispute expected to resurface at next bargaining round.", publishedAt: "2023-09-01" },
    ],
  },
];

export default function StorylinesClient({ userId }: { userId: string | null }) {
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [opinionText, setOpinionText] = useState("");
  const [submittingOpinion, setSubmittingOpinion] = useState(false);
  const [submittingFollow, setSubmittingFollow] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "following">("all");

  useEffect(() => {
    fetchStorylines();
  }, []);

  async function fetchStorylines() {
    setLoading(true);
    try {
      const res = await fetch("/api/storylines");
      const data = await res.json();
      if (data.storylines && data.storylines.length > 0) {
        setStorylines(data.storylines);
      } else {
        // Show seed data while DB is empty
        setStorylines(SEED_STORYLINES.map((s, i) => ({
          ...s,
          id: `seed-${i}`,
          updatedAt: s.chapters[s.chapters.length - 1].publishedAt,
          chapterCount: s.chapters.length,
          latestChapter: { ...s.chapters[s.chapters.length - 1], id: `seed-ch-${i}-last` },
          followers: Math.floor(Math.random() * 400) + 80,
          isFollowing: false,
          myOpinion: null,
          chapters: s.chapters.map((c, j) => ({ ...c, id: `seed-ch-${i}-${j}` })),
        })));
      }
    } catch {
      setStorylines(SEED_STORYLINES.map((s, i) => ({
        ...s,
        id: `seed-${i}`,
        updatedAt: s.chapters[s.chapters.length - 1].publishedAt,
        chapterCount: s.chapters.length,
        latestChapter: { ...s.chapters[s.chapters.length - 1], id: `seed-ch-${i}-last` },
        followers: Math.floor(Math.random() * 400) + 80,
        isFollowing: false,
        myOpinion: null,
        chapters: s.chapters.map((c, j) => ({ ...c, id: `seed-ch-${i}-${j}` })),
      })));
    }
    setLoading(false);
  }

  async function toggleFollow(storylineId: string) {
    if (!userId || storylineId.startsWith("seed-")) return;
    setSubmittingFollow(storylineId);
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
    setSubmittingFollow(null);
  }

  async function submitOpinion(storylineId: string, chapterId: string) {
    if (!userId || !opinionText.trim() || storylineId.startsWith("seed-")) return;
    setSubmittingOpinion(true);
    await fetch("/api/storylines/opinion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storylineId, chapterId, opinion: opinionText }),
    });
    setStorylines(prev =>
      prev.map(s => s.id === storylineId ? { ...s, myOpinion: opinionText } : s)
    );
    setOpinionText("");
    setSubmittingOpinion(false);
  }

  const active = storylines.find(s => s.id === activeId) ?? null;
  const displayed = filter === "following" ? storylines.filter(s => s.isFollowing) : storylines;

  return (
    <AppLayout active="/storylines">
    <div style={{ minHeight: "100vh", backgroundColor: "#06060c", padding: "0 0 80px 0" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "32px 24px 24px" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "18px" }}>📖</span>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "900", color: "#f0ede6", margin: 0, letterSpacing: "-0.5px" }}>
                Storylines
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: "#555", margin: "0 0 20px", lineHeight: "1.6" }}>
              Every major Ontario issue, tracked from start to now. Follow the ones you care about and see how your take holds up over time.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["all", "following"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "100px",
                    border: filter === f ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: filter === f ? "rgba(245,166,35,0.1)" : "transparent",
                    color: filter === f ? "#f5a623" : "#555",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {f === "all" ? "All storylines" : "Following"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 24px 0" }}>
          {loading ? (
            <div style={{ color: "#333", textAlign: "center", paddingTop: "60px", fontSize: "13px" }}>Loading storylines...</div>
          ) : displayed.length === 0 ? (
            <div style={{ color: "#333", textAlign: "center", paddingTop: "60px", fontSize: "13px" }}>
              {filter === "following" ? "You're not following any storylines yet." : "No storylines yet."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayed.map((s) => {
                const sc = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.active;
                const isOpen = activeId === s.id;

                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      borderRadius: "16px",
                      border: isOpen ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(255,255,255,0.05)",
                      backgroundColor: isOpen ? "rgba(245,166,35,0.03)" : "rgba(255,255,255,0.02)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Card header */}
                    <div
                      onClick={() => setActiveId(isOpen ? null : s.id)}
                      style={{ padding: "20px", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span style={{ padding: "3px 9px", borderRadius: "100px", fontSize: "10px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: sc.color, backgroundColor: sc.bg }}>
                              {sc.label}
                            </span>
                            {s.category && (
                              <span style={{ fontSize: "10px", color: "#444", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.category}</span>
                            )}
                            <span style={{ fontSize: "10px", color: "#333" }}>
                              {s.chapterCount} chapter{s.chapterCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: "#e0ddd6", lineHeight: "1.4", fontFamily: "'DM Sans', sans-serif" }}>
                            {s.title}
                          </div>
                        </div>
                        <div style={{ fontSize: "16px", color: "#333", flexShrink: 0, marginTop: "2px", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}>
                          ↓
                        </div>
                      </div>

                      <p style={{ fontSize: "12px", color: "#555", margin: "0 0 12px", lineHeight: "1.6" }}>{s.summary}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "#444" }}>👥 {s.followers} following</span>
                        {s.myOpinion && (
                          <span style={{ fontSize: "11px", color: "#f5a623" }}>✓ You logged a take</span>
                        )}
                        {s.latestChapter && (
                          <span style={{ fontSize: "11px", color: "#333" }}>
                            Latest: {new Date(s.latestChapter.publishedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded: timeline + opinion */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px" }}>

                            {/* Timeline */}
                            <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", marginBottom: "16px" }}>
                              How it unfolded
                            </div>
                            <div style={{ position: "relative", paddingLeft: "20px" }}>
                              <div style={{ position: "absolute", left: "6px", top: 0, bottom: 0, width: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                              {s.chapters.map((ch, idx) => (
                                <div key={ch.id} style={{ position: "relative", marginBottom: "20px" }}>
                                  <div style={{
                                    position: "absolute",
                                    left: "-17px",
                                    top: "4px",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: idx === s.chapters.length - 1 ? "#f5a623" : "rgba(255,255,255,0.12)",
                                    border: idx === s.chapters.length - 1 ? "2px solid rgba(245,166,35,0.3)" : "none",
                                  }} />
                                  <div style={{ fontSize: "10px", color: "#444", marginBottom: "4px" }}>
                                    {new Date(ch.publishedAt).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                                  </div>
                                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#ccc", marginBottom: "4px", lineHeight: "1.4" }}>{ch.title}</div>
                                  <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7" }}>{ch.summary}</div>
                                </div>
                              ))}
                            </div>

                            {/* Your take */}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "20px", marginTop: "4px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
                                Your take
                              </div>

                              {s.myOpinion ? (
                                <div style={{ padding: "14px 16px", borderRadius: "10px", backgroundColor: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.12)", fontSize: "13px", color: "#ccc", lineHeight: "1.6", fontStyle: "italic" }}>
                                  "{s.myOpinion}"
                                </div>
                              ) : userId ? (
                                <div>
                                  <textarea
                                    value={opinionText}
                                    onChange={e => setOpinionText(e.target.value)}
                                    placeholder="What's your take on where this is headed?"
                                    rows={2}
                                    style={{
                                      width: "100%",
                                      padding: "12px 14px",
                                      backgroundColor: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: "10px",
                                      color: "#ccc",
                                      fontSize: "13px",
                                      fontFamily: "'DM Sans', sans-serif",
                                      resize: "none",
                                      outline: "none",
                                      boxSizing: "border-box",
                                      lineHeight: "1.6",
                                      marginBottom: "10px",
                                    }}
                                  />
                                  <button
                                    onClick={() => submitOpinion(s.id, s.latestChapter?.id ?? "")}
                                    disabled={!opinionText.trim() || submittingOpinion}
                                    style={{
                                      padding: "9px 20px",
                                      borderRadius: "9px",
                                      border: "none",
                                      backgroundColor: opinionText.trim() ? "#f5a623" : "rgba(255,255,255,0.05)",
                                      color: opinionText.trim() ? "#000" : "#333",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: opinionText.trim() ? "pointer" : "not-allowed",
                                      fontFamily: "'DM Sans', sans-serif",
                                    }}
                                  >
                                    {submittingOpinion ? "Saving..." : "Log your take"}
                                  </button>
                                </div>
                              ) : (
                                <div style={{ fontSize: "12px", color: "#444" }}>Sign in to log your take and track it over time.</div>
                              )}
                            </div>

                            {/* Follow button */}
                            {userId && (
                              <div style={{ marginTop: "16px" }}>
                                <button
                                  onClick={() => toggleFollow(s.id)}
                                  disabled={submittingFollow === s.id}
                                  style={{
                                    padding: "9px 20px",
                                    borderRadius: "9px",
                                    border: s.isFollowing ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(255,255,255,0.08)",
                                    backgroundColor: s.isFollowing ? "rgba(245,166,35,0.08)" : "transparent",
                                    color: s.isFollowing ? "#f5a623" : "#555",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  {s.isFollowing ? "✓ Following" : "Follow this story"}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}