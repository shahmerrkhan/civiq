"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Newspaper, Zap, BookOpen, Vote, Hourglass, Circle, TrendingUp, MessageSquare, Target, ScrollText, Flame } from "lucide-react";

const STORAGE_KEY = "civiq_tour_done";

type TourStep = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  route?: string;
  accentColor: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    icon: Newspaper,
    label: "Feed",
    title: "Your Ontario Feed",
    description: "The heartbeat of Civiq. Real Ontario political issues, updated daily.",
    bullets: [
      "Left, centre, and right perspectives on every story",
      "Deep dive into the background of any issue",
      "AI explains any story in plain English",
    ],
    route: "/dashboard",
    accentColor: "#f5a623",
  },
  {
    icon: Zap,
    label: "Swipe Mode",
    title: "Swipe Mode",
    description: "Read the feed faster. TikTok-style cards you can swipe through.",
    bullets: [
      "Swipe right to save, left to skip",
      "Covers 5 issues in under 2 minutes",
      "Perfect for your morning routine",
    ],
    route: "/daily",
    accentColor: "#f5a623",
  },
  {
    icon: BookOpen,
    label: "Learn",
    title: "Learn in 5 Minutes",
    description: "200+ bite-sized modules on politics, ideologies, and Ontario systems.",
    bullets: [
      "Each module takes under 5 minutes",
      "Earn XP and badges as you go",
      "Start anywhere — no order required",
    ],
    route: "/learn",
    accentColor: "#a78bfa",
  },
  {
    icon: Vote,
    label: "Polls",
    title: "Poll on Real Issues",
    description: "Vote on issues affecting your life and see where you stand.",
    bullets: [
      "Compare your views to other Gen Z Ontarians",
      "See how your political compass shapes your answers",
      "New polls drop every week",
    ],
    route: "/polls",
    accentColor: "#34d399",
  },
  {
    icon: Hourglass,
    label: "Witness",
    title: "Witness",
    description: "Real Ontario political decisions with a live countdown. Know before it happens.",
    bullets: [
      "Countdowns on bills, court rulings, and elections",
      "Watch any event and get notified when it resolves",
      "AI explains the outcome the moment it happens",
    ],
    route: "/witness",
    accentColor: "#f87171",
  },
  {
    icon: Circle,
    label: "Circles",
    title: "Civic Circles",
    description: "Join issue-based groups and share your take with other Civiq users.",
    bullets: [
      "10 circles covering housing, healthcare, climate, justice and more",
      "See how members lean left, centre, or right on each issue",
      "Post your take, reply to others, like the best arguments",
    ],
    route: "/circles",
    accentColor: "#60a5fa",
  },
  {
    icon: TrendingUp,
    label: "Civic Forecast",
    title: "Civic Forecast",
    description: "Predict what happens in Ontario politics before it happens.",
    bullets: [
      "3 new predictions drop every Monday",
      "Set your confidence — higher confidence = more points if correct",
      "Leaderboard tracks the sharpest predictors",
    ],
    route: "/forecast",
    accentColor: "#a78bfa",
  },
  {
    icon: MessageSquare,
    label: "Debate",
    title: "Structured Debate",
    description: "Get matched with someone who disagrees with you.",
    bullets: [
      "You must steelman their view before arguing",
      "AI moderates and scores the debate",
      "Forces real critical thinking",
    ],
    route: "/debate",
    accentColor: "#60a5fa",
  },
  {
    icon: Target,
    label: "Challenges",
    title: "Weekly Challenges",
    description: "3 missions drop every Monday to push you outside your comfort zone.",
    bullets: [
      "Complete all 3 for your weekly badge",
      "Challenges are based on your political compass",
      "Builds your civic score over time",
    ],
    route: "/challenges",
    accentColor: "#f87171",
  },
  {
    icon: ScrollText,
    label: "Storylines",
    title: "Storylines",
    description: "Follow Ontario political stories as they develop over time.",
    bullets: [
      "Chapter-by-chapter updates on ongoing issues",
      "Never lose track of what matters to you",
      "Follow any story with one tap",
    ],
    route: "/storylines",
    accentColor: "#fb923c",
  },
  {
    icon: Flame,
    label: "Your Score",
    title: "Civic Score & Streak",
    description: "Your consistency is tracked. Come back every day to keep your streak alive.",
    bullets: [
      "Streak resets if you miss a day",
      "Civic score grows with every action",
      "Climb the leaderboard against other Civiq users",
    ],
    route: "/dashboard",
    accentColor: "#f5a623",
  },
];

export function TourButton({ onStart }: { onStart: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      title="Take the app tour"
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        zIndex: 100,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "rgba(245,166,35,0.12)",
        border: "1px solid rgba(245,166,35,0.3)",
        color: "#f5a623",
        fontSize: "16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      ?
    </motion.button>
  );
}

export default function AppTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const current = TOUR_STEPS[step];

  useEffect(() => {
    // Mount flag for tour overlay, intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDone();
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const goTo = (route: string) => {
    finish();
    router.push(route);
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={finish}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#0f0f18",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Progress bar */}
        <div style={{ display: "flex", gap: "3px", padding: "16px 20px 0" }}>
          {TOUR_STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{ backgroundColor: i <= step ? current.accentColor : "rgba(255,255,255,0.07)" }}
              transition={{ duration: 0.3 }}
              style={{ height: "3px", flex: 1, borderRadius: "2px" }}
            />
          ))}
        </div>

        {/* Icon area */}
        <div style={{
          margin: "20px 20px 0",
          borderRadius: "16px",
          backgroundColor: `${current.accentColor}0d`,
          border: `1px solid ${current.accentColor}20`,
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120px", height: "120px",
            borderRadius: "50%",
            backgroundColor: current.accentColor,
            opacity: 0.06,
            filter: "blur(30px)",
            pointerEvents: "none",
          }} />
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}
            >
              <current.icon size={40} strokeWidth={1.5} />
              <div style={{
                fontSize: "11px", fontWeight: "700",
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: current.accentColor, opacity: 0.8,
              }}>
                {current.label}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 0" }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`content-${step}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#f0ede6", marginBottom: "6px", letterSpacing: "-0.3px" }}>
                {current.title}
              </div>
              <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6", marginBottom: "14px" }}>
                {current.description}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "4px" }}>
                {current.bullets.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.2 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
                  >
                    <div style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      backgroundColor: current.accentColor,
                      marginTop: "6px", flexShrink: 0,
                    }} />
                    <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.55" }}>{b}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px 20px" }}>
          {current.route && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => goTo(current.route!)}
              style={{
                width: "100%", padding: "10px", marginBottom: "10px",
                borderRadius: "10px",
                backgroundColor: `${current.accentColor}12`,
                border: `1px solid ${current.accentColor}25`,
                color: current.accentColor,
                fontSize: "12px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Take me there →
            </motion.button>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                fontSize: "12px", fontWeight: "600",
                color: step === 0 ? "#2a2a2a" : "#555",
                background: "none", border: "none",
                cursor: step === 0 ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif", padding: "0",
              }}
            >
              ← Back
            </button>
            <div style={{ fontSize: "11px", color: "#333" }}>
              {step + 1} / {TOUR_STEPS.length}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={next}
              style={{
                fontSize: "13px", fontWeight: "700",
                color: "#000", backgroundColor: current.accentColor,
                border: "none", borderRadius: "8px",
                padding: "8px 20px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {step === TOUR_STEPS.length - 1 ? "Finish ✓" : "Next →"}
            </motion.button>
          </div>
          <button
            onClick={finish}
            style={{
              marginTop: "12px", fontSize: "11px", color: "#2a2a2a",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "block", width: "100%", textAlign: "center",
            }}
          >
            Skip tour
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
