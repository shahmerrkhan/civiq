"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import StreakBadge from "@/components/StreakBadge";
import AppTour, { TourButton } from "@/components/AppTour";

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: "#60a5fa",
  Economy: "#4ade80",
  Education: "#f59e0b",
  Housing: "#a78bfa",
  Healthcare: "#f87171",
  Environment: "#34d399",
  default: "#f5a623",
};
const CATEGORY_STATS: Record<string, string> = {
  Housing: "Average Ontario rent hit $2,400/mo in 2024. Cambridge sits below that — but it's climbing fast.",
  Economy: "1 in 4 Ontario workers earns within $3/hr of minimum wage.",
  Education: "Ontario schools average 29 students per class, up from 24 a decade ago.",
  Healthcare: "Average Ontario ER wait time is 4.5 hours. The provincial target is 4.",
  Environment: "Ontario produces 165 million tonnes of CO₂ annually — higher per capita than the EU average.",
  Infrastructure: "Ontario's transit infrastructure gap is estimated at $28B over the next decade.",
};

const CATEGORY_MODULES: Record<string, { title: string; slug: string }> = {
  Housing: { title: "Rent Control Debate", slug: "rent-control" },
  Economy: { title: "Minimum Wage Economics", slug: "minimum-wage-economics" },
  Education: { title: "How Ontario's Legislature Works", slug: "how-ontarios-legislature-works" },
  Healthcare: { title: "Healthcare Privatization Debate", slug: "healthcare-privatization" },
  Environment: { title: "Climate Change and Politics", slug: "climate-change-politics" },
  Infrastructure: { title: "Electoral Reform in Canada", slug: "electoral-reform" },
};

type Card = {
  id: number;
  dbId?: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  time: string;
  perspectives: { left: string; centre: string; right: string };
  deepdive: string;
};


export default function DashboardClient({ compassPosition }: { compassPosition: { x: number; y: number } | null }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [activePerspective, setActivePerspective] = useState<"left" | "centre" | "right">("centre");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showDeepDive, setShowDeepDive] = useState<number | null>(null);
  const [explainCard, setExplainCard] = useState<number | null>(null);
  const [explainText, setExplainText] = useState<Record<number, string>>({});
  const [explainLoading, setExplainLoading] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [bookmarkLoading, setBookmarkLoading] = useState<number | null>(null);
  const [til, setTil] = useState<string | null>(null);
  const [discussLoading, setDiscussLoading] = useState<number | null>(null);
  const [storylineCount, setStorylineCount] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("civiq_tour_done");
    if (!done) {
      const t = setTimeout(() => setTourActive(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);
  
  const handleDiscuss = async (card: Card) => {
    setDiscussLoading(card.id);
    try {
      const compassLabel = compassPosition
        ? (compassPosition.x < -0.2 ? "left" : compassPosition.x > 0.2 ? "right" : "centre")
        : "centre";
      const res = await fetch("/api/debate/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardDbId: card.dbId ?? String(card.id),
          cardTitle: card.title,
          cardSummary: card.summary,
          userLeaning: compassLabel,
        }),
      });
      const data = await res.json();
      if (data.room) {
        window.location.href = `/debate/${data.room.id}`;
      }
    } catch {}
    setDiscussLoading(null);
  };

  useEffect(() => {
    fetch("/api/storylines")
      .then(r => r.json())
      .then(d => {
        const followed = (d.storylines ?? []).filter((s: any) => s.isFollowing).length;
        setStorylineCount(followed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/til")
      .then(r => r.json())
      .then(data => { if (data.til) setTil(data.til); })
      .catch(() => {});
  }, []);

  const handleBookmark = async (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkLoading(card.id);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardTitle: card.title,
          cardSummary: card.summary,
          cardCategory: card.category,
          cardSource: card.source,
          cardDbId: card.dbId ?? null,
        }),
      });
      const data = await res.json();
      setBookmarked(prev => ({ ...prev, [card.id]: data.bookmarked }));
    } catch {}
    setBookmarkLoading(null);
  };

  const handleExplain = async (card: Card) => {
    if (explainText[card.id]) {
      setExplainCard(explainCard === card.id ? null : card.id);
      return;
    }
    setExplainCard(card.id);
    setExplainLoading(card.id);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: card.title, summary: card.summary }),
      });
      const data = await res.json();
      setExplainText(prev => ({ ...prev, [card.id]: data.explanation }));
    } catch {
      setExplainText(prev => ({ ...prev, [card.id]: "Could not load explanation." }));
    }
    setExplainLoading(null);
  };
  
  const filters = ["All", "Infrastructure", "Economy", "Education", "Housing", "Healthcare", "Environment"];

  useEffect(() => {
    fetch("/api/feed")
      .then(r => r.json())
      .then(data => {
        if (data.cards) setCards(data.cards);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const filteredCards = activeFilter === "All" ? cards : cards.filter(c => c.category === activeFilter);

  return (
    <AppLayout active="/dashboard">
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
      `}</style>
  <div style={{ flex: 1, padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 24px)", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "4px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>Ontario Feed</div>
            <StreakBadge />
          </div>
          <div style={{ fontSize: "14px", color: "#444" }}>What's happening in your province today</div>
        </motion.div>

          {storylineCount > 0 && (
          <Link href="/storylines" style={{ textDecoration: "none", display: "block", marginBottom: "12px" }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: "10px",
                background: "rgba(245,166,35,0.05)",
                border: "1px solid rgba(245,166,35,0.12)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>📖</span>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#f5a623" }}>
                  {storylineCount} {storylineCount === 1 ? "story" : "stories"} you follow
                </div>
                <div style={{ fontSize: "12px", color: "#444" }}>— see what's developed</div>
              </div>
              <div style={{ fontSize: "13px", color: "#444" }}>→</div>
            </motion.div>
          </Link>
        )}

        <Link href="/daily" style={{ textDecoration: "none", display: "block", marginBottom: "8px" }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: "10px",
              background: "rgba(245,166,35,0.05)",
              border: "1px solid rgba(245,166,35,0.12)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>⚡</span>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#f5a623" }}>Swipe Mode</div>
              <div style={{ fontSize: "12px", color: "#444" }}>— read faster</div>
            </div>
            <div style={{ fontSize: "13px", color: "#444" }}>→</div>
          </motion.div>
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            { href: "/witness", icon: "⏳", label: "Witness", sub: "live countdowns", color: "#f87171" },
            { href: "/forecast", icon: "🔮", label: "Forecast", sub: "predict outcomes", color: "#a78bfa" },
            { href: "/circles", icon: "🔵", label: "Circles", sub: "join the debate", color: "#60a5fa" },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "12px 8px", borderRadius: "12px", textAlign: "center",
                  background: `${item.color}08`,
                  border: `1px solid ${item.color}20`,
                  cursor: "pointer", gap: "4px",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <div style={{ fontSize: "11px", fontWeight: "700", color: item.color }}>{item.label}</div>
                <div style={{ fontSize: "10px", color: "#333" }}>{item.sub}</div>
              </motion.div>
            </Link>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
            style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: "4px" }}
          >
          {filters.map((f, i) => (
            <motion.button
              key={f}
              onClick={() => setActiveFilter(f)}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "7px 18px",
                borderRadius: "100px",
                fontSize: "13px",
                fontWeight: "600",
                border: activeFilter === f ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: activeFilter === f ? "rgba(245,166,35,0.12)" : "transparent",
                color: activeFilter === f ? "#f5a623" : "#555",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {f}
            </motion.button>
          ))}
        </motion.div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>Generating today's Ontario feed...</div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: "160px", borderRadius: "16px" }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ color: "#555", fontSize: "14px" }}>Could not load feed.</div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeFilter} data-tour="feed">
            {!loading && !error && filteredCards.map((card, i) => {
              const expanded = activeCard === card.id;
              const color = CATEGORY_COLORS[card.category] || CATEGORY_COLORS.default;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches ? { y: -2, transition: { duration: 0.2 } } : {}}
                  onClick={() => { setActiveCard(expanded ? null : card.id); setShowDeepDive(null); }}
                  style={{
                    backgroundColor: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${expanded ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "18px",
                    padding: "clamp(16px, 4vw, 24px)",
                    marginBottom: "10px",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease, border-color 0.2s ease",
                    boxShadow: expanded ? `0 0 40px ${color}10` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "700", lineHeight: "1.4", letterSpacing: "-0.3px", color: "#fff", flex: 1 }}>
                      {card.title}
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: "700", color,
                      backgroundColor: `${color}15`, padding: "3px 10px",
                      borderRadius: "100px", whiteSpace: "nowrap",
                      letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
                    }}>{card.category}</span>
                  </div>

                  <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6", marginBottom: "12px" }}>
                    {card.summary}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "12px", color: "#555", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>{card.source}</span>
                    <span>·</span>
                    <span>{card.time}</span>
                    <span>·</span>
                    <motion.span
                      animate={{ color: expanded ? "#f5a623" : "#444" }}
                      style={{ fontWeight: "600" }}
                    >
                      {expanded ? "Collapse" : "See perspectives →"}
                    </motion.span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleBookmark(card, e)}
                    disabled={bookmarkLoading === card.id}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", fontSize: "16px",
                      opacity: bookmarkLoading === card.id ? 0.5 : 1,
                      transition: "opacity 0.2s ease",
                      padding: "2px",
                    }}
                  >
                    {bookmarked[card.id] ? "🔖" : "🏷️"}
                  </motion.button>
                </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          {CATEGORY_STATS[card.category] && (
                            <div style={{
                              backgroundColor: "rgba(245,166,35,0.05)",
                              border: "1px solid rgba(245,166,35,0.12)",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              marginBottom: "16px",
                              fontSize: "13px",
                              color: "#888",
                              lineHeight: "1.6",
                            }}>
                              <span style={{ color: "#f5a623", fontWeight: "700", marginRight: "6px" }}>📍 Affects you:</span>
                              {CATEGORY_STATS[card.category]}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            {(["left", "centre", "right"] as const).map((p) => {
                              const pColors: Record<string, string> = { left: "#60a5fa", centre: "#a78bfa", right: "#f87171" };
                              const isActive = activePerspective === p;
                              return (
                                <motion.button
                                  key={p}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); setActivePerspective(p); }}
                                  style={{
                                    padding: "5px 14px", borderRadius: "100px",
                                    fontSize: "12px", fontWeight: "600",
                                    border: `1px solid ${isActive ? pColors[p] : "rgba(255,255,255,0.08)"}`,
                                    backgroundColor: isActive ? `${pColors[p]}15` : "transparent",
                                    color: isActive ? pColors[p] : "#444",
                                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  {p.charAt(0).toUpperCase() + p.slice(1)}
                                </motion.button>
                              );
                            })}
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activePerspective}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              transition={{ duration: 0.2 }}
                              style={{ fontSize: "14px", color: "#888", lineHeight: "1.8", fontStyle: "italic", marginBottom: "16px" }}
                            >
                              "{card.perspectives[activePerspective]}"
                            </motion.div>
                          </AnimatePresence>

                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => { e.stopPropagation(); setShowDeepDive(showDeepDive === card.id ? null : card.id); }}
                              style={{
                                fontSize: "12px", color: "#f5a623",
                                backgroundColor: "rgba(245,166,35,0.06)",
                                border: "1px solid rgba(245,166,35,0.15)",
                                padding: "7px 16px", borderRadius: "8px",
                                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                fontWeight: "600",
                              }}
                            >
                              {showDeepDive === card.id ? "Hide deep dive" : "Deep dive →"}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => { e.stopPropagation(); handleExplain(card); }}
                              style={{
                                fontSize: "12px", color: "#a78bfa",
                                backgroundColor: "rgba(167,139,250,0.06)",
                                border: "1px solid rgba(167,139,250,0.15)",
                                padding: "7px 16px", borderRadius: "8px",
                                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                fontWeight: "600",
                              }}
                            >
                              {explainLoading === card.id ? "Explaining..." : explainCard === card.id && explainText[card.id] ? "Hide explanation" : "🧠 Explain this"}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => { e.stopPropagation(); handleDiscuss(card); }}
                              style={{
                                fontSize: "12px", color: "#34d399",
                                backgroundColor: "rgba(52,211,153,0.06)",
                                border: "1px solid rgba(52,211,153,0.15)",
                                padding: "7px 16px", borderRadius: "8px",
                                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                fontWeight: "600",
                              }}
                            >
                              {discussLoading === card.id ? "Matching..." : "⚡ Discuss"}
                            </motion.button>
                          </div>

                          <AnimatePresence>
                            {showDeepDive === card.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{
                                  marginTop: "14px", fontSize: "14px", color: "#666",
                                  lineHeight: "1.7", padding: "16px",
                                  backgroundColor: "rgba(245,166,35,0.04)",
                                  borderRadius: "12px", border: "1px solid rgba(245,166,35,0.08)",
                                }}>
                                  {card.deepdive}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                            {CATEGORY_MODULES[card.category] && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              style={{
                                marginTop: "16px",
                                padding: "14px 16px",
                                backgroundColor: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div>
                                <div style={{ fontSize: "10px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>Want to understand this better?</div>
                                <div style={{ fontSize: "13px", color: "#ccc", fontWeight: "600" }}>{CATEGORY_MODULES[card.category].title}</div>
                              </div>
                              <Link
                                href={`/learn/${CATEGORY_MODULES[card.category].slug}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  fontSize: "12px", color: "#f5a623",
                                  backgroundColor: "rgba(245,166,35,0.08)",
                                  border: "1px solid rgba(245,166,35,0.2)",
                                  padding: "7px 14px", borderRadius: "8px",
                                  fontWeight: "700", textDecoration: "none",
                                  whiteSpace: "nowrap", flexShrink: 0,
                                }}
                              >
                                5 min →
                              </Link>
                            </motion.div>
                          )}
                          <AnimatePresence>
                            {explainCard === card.id && explainText[card.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{
                                  marginTop: "14px", fontSize: "14px", color: "#aaa",
                                  lineHeight: "1.7", padding: "16px",
                                  backgroundColor: "rgba(167,139,250,0.04)",
                                  borderRadius: "12px", border: "1px solid rgba(167,139,250,0.1)",
                                }}>
                                  <div style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>Plain English</div>
                                  {explainText[card.id]}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    {tourActive && <AppTour onDone={() => setTourActive(false)} />}
      <TourButton onStart={() => setTourActive(true)} />
    </AppLayout>
  );
}
