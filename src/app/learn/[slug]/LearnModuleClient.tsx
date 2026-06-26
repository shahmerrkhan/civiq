"use client";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Flashcard = {
  type: "fact" | "quote" | "question" | "stat" | "myth";
  front: string;
  back: string;
  emoji: string;
};

type Module = {
  title: string;
  minutes: number;
  category: string;
  prompt: string;
};

const TYPE_COLORS: Record<string, string> = {
  fact: "#60a5fa",
  quote: "#a78bfa",
  question: "#f5a623",
  stat: "#4ade80",
  myth: "#f87171",
};

const categoryColors: Record<string, string> = {
  Systems: "#60a5fa",
  Ideologies: "#a78bfa",
  Figures: "#f5a623",
  "Canada & World": "#34d399",
  Issues: "#fb923c",
};

export default function LearnModuleClient({ module, slug }: { module: Module; slug: string }) {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [cardKey, setCardKey] = useState(0);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    fetch(`/api/learn/${slug}`)
      .then(r => r.json())
      .then(data => {
        try {
          const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
          setCards(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCards([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const color = categoryColors[module.category] || "#f5a623";
  const safeCards = cards ?? [];
  const progress = safeCards.length > 0 ? (current / safeCards.length) * 100 : 0;
  const card = safeCards[current];

  const handleNext = () => {
    const isLast = current === safeCards.length - 1;
    if (flipped) {
      setFlipped(false);
      setTimeout(() => {
        if (!isLast) {
          setDirection(1);
          setCurrent(c => c + 1);
          setCardKey(k => k + 1);
        } else {
          setDone(true);
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          fetch("/api/streak", { method: "POST" });
        }
      }, 250);
    } else {
      if (!isLast) {
        setDirection(1);
        setCurrent(c => c + 1);
        setCardKey(k => k + 1);
      } else {
        setDone(true);
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        fetch("/api/streak", { method: "POST" });
      }
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setFlipped(false);
      setTimeout(() => {
        setDirection(-1);
        setCurrent(c => c - 1);
        setCardKey(k => k + 1);
      }, flipped ? 250 : 0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Loading state
  if (loading) return (
    <AppLayout active="/learn">
      <div style={{ padding: "40px 60px", maxWidth: "700px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: "24px", fontSize: "13px", color: "#444" }}
        >
          Generating flashcards...
        </motion.div>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            style={{
              height: i === 0 ? "320px" : "48px",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "20px",
              marginBottom: "12px",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
    </AppLayout>
  );

  // Done state
  if (done) return (
    <AppLayout active="/learn">
      <div style={{ padding: "40px 60px", maxWidth: "700px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ fontSize: "64px", marginBottom: "24px" }}
        >
          🎉
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "10px", color: "#fff" }}>
            Module complete
          </div>
          <div style={{ fontSize: "14px", color: "#555", marginBottom: "40px", lineHeight: "1.7" }}>
            You went through all {safeCards.length} cards on {module.title}.
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", gap: "12px", justifyContent: "center" }}
        >
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setCurrent(0); setFlipped(false); setDone(false); setCardKey(k => k + 1); }}
            style={{
              padding: "13px 26px", borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent", color: "#fff",
              fontSize: "14px", fontWeight: "600",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "background-color 0.2s ease",
            }}
          >Review again</motion.button>
          <motion.button
            whileHover={{ scale: 1.03, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/learn")}
            style={{
              padding: "13px 26px", borderRadius: "12px",
              border: "none", backgroundColor: color,
              color: "#000", fontSize: "14px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >Back to Learn</motion.button>
        </motion.div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout active="/learn">
      <div
        style={{ padding: "24px 20px", maxWidth: "700px", width: "100%", fontFamily: "'DM Sans', sans-serif", margin: "0 auto" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: -3, color: "#fff" }}
          onClick={() => router.push("/learn")}
          style={{
            background: "none", border: "none", color: "#444",
            fontSize: "14px", cursor: "pointer",
            marginBottom: "28px", padding: 0,
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s ease",
          }}
        >← Back</motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}
        >
          <span style={{ fontSize: "13px", color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
            {module.title}
          </span>
          <motion.span
            key={current}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: "13px", color: "#444", flexShrink: 0 }}
          >
            {current + 1} / {safeCards.length}
          </motion.span>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            width: "100%", height: "3px",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: "10px", marginBottom: "36px", overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: "100%", backgroundColor: color, borderRadius: "10px" }}
          />
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait" custom={direction}>
          {card && (
            <motion.div
              key={cardKey}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: "1200px", marginBottom: "24px", cursor: "pointer" }}
              onClick={() => setFlipped(f => !f)}
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "relative", height: "380px", transformStyle: "preserve-3d", willChange: "transform" }}
                >
                {/* Front */}
                <motion.div
                  style={{
                    position: "absolute", inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${TYPE_COLORS[card.type] || "#f5a623"}30`,
                    borderRadius: "20px", padding: "clamp(20px, 5vw, 36px)",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 20 }}
                      style={{
                        fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em",
                        textTransform: "uppercase", color: TYPE_COLORS[card.type] || "#f5a623",
                        backgroundColor: `${TYPE_COLORS[card.type] || "#f5a623"}15`,
                        padding: "3px 10px", borderRadius: "100px",
                      }}
                    >{card.type}</motion.span>
                    <motion.span
                      initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 350, damping: 16 }}
                      style={{ fontSize: "32px" }}
                    >{card.emoji}</motion.span>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: "700", lineHeight: "1.35", letterSpacing: "-0.3px", color: "#fff" }}
                  >
                    {card.front}
                  </motion.div>

                  <div style={{ fontSize: "12px", color: "#444" }}>
                    Tap to reveal
                  </div>
                </motion.div>

                {/* Back */}
                <motion.div
                  style={{
                    position: "absolute", inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    rotateY: 180,
                    backgroundColor: `${TYPE_COLORS[card.type] || "#f5a623"}08`,
                    border: `1px solid ${TYPE_COLORS[card.type] || "#f5a623"}40`,
                    borderRadius: "20px", padding: "36px",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    overflowY: "auto",
                  }}
                >
                    <div style={{ fontSize: "14px", color: "#ccc", lineHeight: "1.7", wordBreak: "break-word" }}>
                    {card.back}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", gap: "12px" }}
        >
          <motion.button
            whileHover={current > 0 ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" } : {}}
            whileTap={current > 0 ? { scale: 0.97 } : {}}
            onClick={handlePrev}
            disabled={current === 0}
            style={{
              flex: 1, padding: "14px", borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent",
              color: current === 0 ? "#222" : "#fff",
              fontSize: "14px", fontWeight: "600",
              cursor: current === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s ease",
            }}
          >← Previous</motion.button>

          <motion.button
            whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            style={{
              flex: 2, padding: "14px", borderRadius: "12px",
              border: "none", backgroundColor: color,
              color: "#000", fontSize: "14px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "filter 0.2s ease",
            }}
          >
            {current === safeCards.length - 1 ? "Finish" : "Next →"}
          </motion.button>
        </motion.div>
      </div>
    </AppLayout>
  );
}