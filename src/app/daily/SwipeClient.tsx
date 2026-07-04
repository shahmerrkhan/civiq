"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

type SwipeCard = {
  id: number;
  title: string;
  summary: string;
  category: string;
  source: string;
  time: string;
  perspectives: { left: string; centre: string; right: string };
  deepdive: string;
  stat?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: "#60a5fa",
  Economy: "#4ade80",
  Education: "#f59e0b",
  Housing: "#a78bfa",
  Healthcare: "#f87171",
  Environment: "#34d399",
  default: "#f5a623",
};

const CATEGORY_BG: Record<string, string> = {
  Infrastructure: "rgba(96,165,250,0.06)",
  Economy: "rgba(74,222,128,0.06)",
  Education: "rgba(245,158,11,0.06)",
  Housing: "rgba(167,139,250,0.06)",
  Healthcare: "rgba(248,113,113,0.06)",
  Environment: "rgba(52,211,153,0.06)",
  default: "rgba(245,166,35,0.06)",
};

const REACTIONS = [
  { emoji: "🔥", label: "Big deal" },
  { emoji: "🤔", label: "Complex" },
  { emoji: "😤", label: "Angry" },
  { emoji: "💡", label: "Learned" },
];

export default function SwipeClient() {
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [perspective, setPerspective] = useState<"left" | "centre" | "right">("centre");
  const [reaction, setReaction] = useState<string | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const isDragging = useRef(false);

  const hasMore = useRef(true);

  const fetchCards = useCallback(async (pageNum: number, append = false) => {
    if (append && !hasMore.current) {
      setLoadingMore(false);
      return;
    }
    try {
      const res = await fetch(`/api/feed?page=${pageNum}&limit=10`);
      const data = await res.json();
      if (data.cards) {
        setCards(prev => append ? [...prev, ...data.cards] : data.cards);
        hasMore.current = data.hasMore;
      }
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    // Initial data load on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCards(1);
  }, [fetchCards]);

  // Load more when 3 cards from end
  useEffect(() => {
    if (cards.length > 0 && index >= cards.length - 3 && !loadingMore) {
      // Infinite-scroll pagination trigger, intentional
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCards(nextPage, true);
    }
  }, [index, cards.length, loadingMore, page, fetchCards]);

    const [flash, setFlash] = useState(false);
    const [showShare, setShowShare] = useState(false);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const goNext = useCallback(() => {
    if (index < cards.length - 1) {
      triggerFlash();
      setDirection("up");
      setIndex(i => i + 1);
      setPerspective("centre");
      setReaction(null);
      setShowDeepDive(false);
      setBookmarked(false);
      if (index + 1 === 4) setShowShare(true);
    }
  }, [index, cards.length]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      triggerFlash();
      setDirection("down");
      setIndex(i => i - 1);
      setPerspective("centre");
      setReaction(null);
      setShowDeepDive(false);
      setBookmarked(false);
    }
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") goNext();
      if (e.key === "ArrowDown" || e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const onTouchMove = () => {
    isDragging.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    if (Math.abs(dy) > 30 && Math.abs(dy) > dx) {
        if (dy > 0) goNext();
      else goPrev();
    }
  };

  // Wheel handler for desktop
  const lastWheel = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheel.current < 600) return;
    lastWheel.current = now;
    if (e.deltaY > 40) goNext();
    else if (e.deltaY < -40) goPrev();
  };

  const handleBookmark = async () => {
    const card = cards[index];
    if (!card) return;
    setBookmarked(b => !b);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardTitle: card.title,
          cardSummary: card.summary,
          cardCategory: card.category,
          cardSource: card.source,
          cardDbId: String(card.id),
        }),
      });
    } catch {}
  };

  if (loading) {
    return (
      <AppLayout active="/daily">
        <div style={{ height: "80vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: "28px", height: "28px", border: "2px solid rgba(245,166,35,0.2)", borderTopColor: "#f5a623", borderRadius: "50%" }}
          />
          <div style={{ fontSize: "13px", color: "#666" }}>Loading feed...</div>
        </div>
      </AppLayout>
    );
  }

  if (!cards.length) {
    return (
      <AppLayout active="/daily">
        <div style={{ height: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "14px", color: "#444" }}>No stories right now. Check back soon.</div>
        </div>
      </AppLayout>
    );
  }

  const card = cards[index];
  const color = CATEGORY_COLORS[card.category] || CATEGORY_COLORS.default;
  const bg = CATEGORY_BG[card.category] || CATEGORY_BG.default;
  const pColors = { left: "#60a5fa", centre: "#f5a623", right: "#f87171" };

  return (
    <AppLayout active="/daily">
      <style>{`
        .swipe-container {
          height: calc(100vh - 140px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          -ms-overflow-style: none;
        }
        .swipe-container::-webkit-scrollbar { display: none; }
        .card-inner::-webkit-scrollbar { display: none; }
          user-select: none;
        }
        @media (max-width: 768px) {
          .swipe-container {
            height: calc(100vh - 130px);
          }
          .swipe-actions { flex-wrap: wrap !important; }
        }
        .perspective-btn {
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: #777;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
        }
        .reaction-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 8px 10px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
          flex: 1;
        }
        .reaction-btn:hover { background: rgba(255,255,255,0.06); }
        .progress-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .progress-dot.active {
          background: #f5a623;
          width: 16px;
          border-radius: 2px;
        }
        .progress-dot.visited {
          background: rgba(245,166,35,0.3);
        }
      `}</style>

      <div
        ref={containerRef}
        className="swipe-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {flash && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "20px", zIndex: 10, pointerEvents: "none", transition: "opacity 0.15s ease" }} />
        )}

      <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed",
                bottom: "84px",
                left: "12px", right: "12px",
                backgroundColor: "#0f0f18",
                border: "1px solid rgba(245,166,35,0.3)",
                borderRadius: "18px",
                padding: "16px 18px",
                zIndex: 100,
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede6", marginBottom: "3px" }}>
                  🔥 You&apos;ve read 5 stories
                </div>
                <div style={{ fontSize: "11px", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Share with friends and grow the movement
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                <button
                  onClick={() => setShowShare(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#444", fontFamily: "'DM Sans', sans-serif", padding: "4px" }}
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    setShowShare(false);
                    if (navigator.share) {
                      navigator.share({
                        title: "Civiq",
                        text: `I just read today's Ontario feed on Civiq 🔥 Stay informed:`,
                        url: "https://civiq-sooty.vercel.app",
                      }).catch(() => {});
                    }
                  }}
                  style={{
                    backgroundColor: "#f5a623", color: "#000",
                    border: "none", borderRadius: "10px",
                    padding: "8px 16px", fontSize: "12px",
                    fontWeight: "700", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  Share 🔗
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Progress dots + counter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "0 2px" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {Array.from({ length: Math.min(cards.length, 7) }).map((_, i) => {
              const start = Math.max(0, Math.min(index - 3, cards.length - 7));
              const realI = start + i;
              return (
                <div
                  key={realI}
                  className={`progress-dot ${realI === index ? "active" : realI < index ? "visited" : ""}`}
                />
              );
            })}
          </div>
          <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>
            {index + 1} / {loadingMore ? "..." : cards.length}
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={card.id}
            custom={direction}
            initial={{ opacity: 0, y: direction === "up" ? 60 : -60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? -60 : 60, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              flex: 1,
              backgroundColor: "#0e0e16",
              border: `1px solid ${color}22`,
              borderRadius: "20px",
              padding: "clamp(14px, 3vw, 24px)",
              display: "flex",
              flexDirection: "column",
              gap: "0",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch" as never,
              scrollbarWidth: "none" as never,
              background: `linear-gradient(145deg, ${bg} 0%, #0e0e16 60%)`,
              boxShadow: `0 0 40px ${color}08`,
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontSize: "10px", fontWeight: "800", letterSpacing: "0.08em",
                  color, backgroundColor: `${color}18`,
                  padding: "3px 10px", borderRadius: "4px",
                }}>
                  {card.category.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#666" }}>{card.time}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleBookmark}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", opacity: bookmarked ? 1 : 0.3, transition: "opacity 0.2s" }}
                >
                  🔖
                </button>
              </div>
            </div>

            {/* Headline */}
            <div style={{ fontSize: "clamp(16px, 3vw, 22px)", fontWeight: "800", color: "#f0ede6", lineHeight: "1.3", letterSpacing: "-0.5px", marginBottom: "10px" }}>
                  {card.title}
            </div>

            {/* Summary */}
            <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.6", marginBottom: "12px" }}>
              {card.summary}
            </div>

            {/* Stat pill */}
            {card.stat && (
              <div style={{
                padding: "12px 16px", borderRadius: "12px",
                backgroundColor: `${color}0d`,
                border: `1px solid ${color}22`,
                fontSize: "13px", color: "#888", lineHeight: "1.6",
                marginBottom: "12px", fontStyle: "italic",
            }}>
                📊 {card.stat}
              </div>
            )}

            {/* Perspectives */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                {(["left", "centre", "right"] as const).map(p => (
                  <button
                    key={p}
                    className="perspective-btn"
                    onClick={() => setPerspective(p)}
                    style={{
                      borderColor: perspective === p ? pColors[p] : undefined,
                      backgroundColor: perspective === p ? `${pColors[p]}15` : undefined,
                      color: perspective === p ? pColors[p] : undefined,
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={perspective}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{ fontSize: "13px", color: "#777", lineHeight: "1.75", fontStyle: "italic" }}
                >
                  &quot;{card.perspectives[perspective]}&quot;
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Deep dive toggle */}
            <AnimatePresence>
              {showDeepDive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden", marginBottom: "16px" }}
                >
                  <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", fontSize: "13px", color: "#666", lineHeight: "1.7" }}>
                    {card.deepdive}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Source + deep dive */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", color: "#666" }}>via {card.source}</span>
              <button
                onClick={() => setShowDeepDive(d => !d)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#f5a623", fontWeight: "700", fontFamily: "'DM Sans', sans-serif" }}
              >
                {showDeepDive ? "Less ↑" : "Deep dive ↓"}
              </button>
            </div>

            {/* Reactions */}
              <div className="swipe-actions" style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {REACTIONS.map(r => (
                <button
                  key={r.emoji}
                  className="reaction-btn"
                  onClick={() => setReaction(reaction === r.emoji ? null : r.emoji)}
                  style={{
                    borderColor: reaction === r.emoji ? color : undefined,
                    backgroundColor: reaction === r.emoji ? `${color}15` : undefined,
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{r.emoji}</span>
                  <span style={{ fontSize: "10px", color: "#777", fontWeight: "600" }}>{r.label}</span>
                </button>
              ))}
            </div>

            {/* Navigation hints */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <button
                onClick={goPrev}
                disabled={index === 0}
                style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", fontSize: "12px", color: index === 0 ? "#555" : "#777", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              >
                ↑ Previous
              </button>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.06em" }}>
                SWIPE OR SCROLL
              </div>
              <button
                onClick={goNext}
                disabled={index === cards.length - 1}
                style={{ background: "none", border: "none", cursor: index === cards.length - 1 ? "default" : "pointer", fontSize: "12px", color: index === cards.length - 1 ? "#222" : "#f5a623", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}
              >
                Next ↓
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}






