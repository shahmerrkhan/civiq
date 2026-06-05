"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    question: "Your city needs money. What should the government cut first?",
    options: [
      { text: "Corporate subsidies", value: { x: -1, y: 0 } },
      { text: "Public services like transit", value: { x: 1, y: 0 } },
      { text: "Police budgets", value: { x: -0.5, y: -1 } },
      { text: "Parks and recreational centres", value: { x: 0.5, y: 0 } },
    ],
  },
  {
    id: 2,
    question: "Ontario wants to build more housing. What's the best approach?",
    options: [
      { text: "Let developers build freely with minimal rules", value: { x: 1, y: 0.5 } },
      { text: "Government builds affordable housing directly", value: { x: -1, y: 0 } },
      { text: "Mixed — some private, some public", value: { x: 0, y: 0 } },
      { text: "Focus on renovating existing homes first", value: { x: -0.5, y: -0.5 } },
    ],
  },
  {
    id: 3,
    question: "A factory is polluting a river but employs 2,000 people. What happens?",
    options: [
      { text: "Shut it down, environment first", value: { x: -1, y: -1 } },
      { text: "Fine them but keep it running", value: { x: 0, y: 0 } },
      { text: "Let the market decide", value: { x: 1, y: 1 } },
      { text: "Government helps transition workers to green jobs", value: { x: -0.5, y: -0.5 } },
    ],
  },
  {
    id: 4,
    question: "How should Ontario fund healthcare?",
    options: [
      { text: "100% public, tax funded", value: { x: -1, y: 0 } },
      { text: "Mix of public and private options", value: { x: 0.5, y: 0.5 } },
      { text: "Fully privatized for efficiency", value: { x: 1, y: 1 } },
      { text: "Public but with major reforms", value: { x: -0.5, y: 0 } },
    ],
  },
  {
    id: 5,
    question: "Should there be a minimum wage increase in Ontario?",
    options: [
      { text: "Yes, significantly — cost of living is too high", value: { x: -1, y: 0 } },
      { text: "Small increase tied to inflation only", value: { x: 0, y: 0 } },
      { text: "No — it hurts small businesses", value: { x: 1, y: 0.5 } },
      { text: "Replace it with a universal basic income", value: { x: -1, y: -1 } },
    ],
  },
  {
    id: 6,
    question: "How should Ontario handle immigration?",
    options: [
      { text: "Open and welcoming — we need more people", value: { x: -0.5, y: -1 } },
      { text: "Skilled workers only, strict limits", value: { x: 1, y: 0.5 } },
      { text: "Current levels are fine", value: { x: 0, y: 0 } },
      { text: "Reduce it — focus on current residents first", value: { x: 1, y: 1 } },
    ],
  },
  {
    id: 7,
    question: "A student can't afford university. What should happen?",
    options: [
      { text: "Free tuition funded by taxes", value: { x: -1, y: 0 } },
      { text: "More grants and bursaries", value: { x: -0.5, y: 0 } },
      { text: "Better student loan systems", value: { x: 0, y: 0 } },
      { text: "They should work their way through like others did", value: { x: 1, y: 1 } },
    ],
  },
  {
    id: 8,
    question: "What's your view on police funding in Ontario cities?",
    options: [
      { text: "Increase it — we need more safety", value: { x: 1, y: 1 } },
      { text: "Keep it the same", value: { x: 0.5, y: 0 } },
      { text: "Redirect some to mental health services", value: { x: -0.5, y: -0.5 } },
      { text: "Significantly defund and reimagine public safety", value: { x: -1, y: -1 } },
    ],
  },
  {
    id: 9,
    question: "Ontario's carbon tax — your take?",
    options: [
      { text: "Essential for fighting climate change", value: { x: -1, y: -0.5 } },
      { text: "Good idea but poorly implemented", value: { x: -0.5, y: 0 } },
      { text: "Too expensive for regular people", value: { x: 0.5, y: 0.5 } },
      { text: "Scrap it entirely", value: { x: 1, y: 1 } },
    ],
  },
  {
    id: 10,
    question: "Who should make decisions about your local community?",
    options: [
      { text: "The federal government for consistency", value: { x: 0, y: 1 } },
      { text: "The provincial government", value: { x: 0, y: 0.5 } },
      { text: "Local city councils", value: { x: 0, y: -0.5 } },
      { text: "The community itself through direct voting", value: { x: -0.5, y: -1 } },
    ],
  },
];

const TOPICS = [
  { id: "housing", label: "Housing", emoji: "🏠" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "environment", label: "Environment", emoji: "🌿" },
  { id: "economy", label: "Economy", emoji: "💰" },
  { id: "infrastructure", label: "Infrastructure", emoji: "🚇" },
];

function getLabel(x: number, y: number) {
  if (x < -0.15 && y < -0.15) return { label: "Left Libertarian", color: "#4ade80", desc: "You value personal freedom and progressive economics." };
  if (x < -0.15 && y >= -0.15) return { label: "Left Leaning", color: "#60a5fa", desc: "You lean toward collective solutions and social equity." };
  if (x > 0.15 && y < -0.15) return { label: "Right Libertarian", color: "#f59e0b", desc: "You value personal freedom and free market economics." };
  if (x > 0.15 && y >= -0.15) return { label: "Right Leaning", color: "#f87171", desc: "You lean toward traditional values and market solutions." };
  if (x < -0.05) return { label: "Centre Left", color: "#818cf8", desc: "You support moderate progressive policies." };
  if (x > 0.05) return { label: "Centre Right", color: "#fb923c", desc: "You support moderate conservative policies." };
  return { label: "Centrist", color: "#a78bfa", desc: "You weigh issues individually rather than along party lines." };
}

type Stage = "welcome" | "quiz" | "topics" | "result" | "notifications";

  export default function OnboardingClient() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("civiq_onboarding_done") === "true") {
      router.push("/dashboard");
    }
  }, []);
  const [stage, setStage] = useState<Stage>("welcome");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ x: number; y: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ x: number; y: number } | null>(null);
  const [direction, setDirection] = useState(1);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  const handleEnableNotifications = async () => {
    setNotifLoading(true);
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        goToDashboard();
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { goToDashboard(); return; }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { goToDashboard(); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
        }),
      });
      setNotifDone(true);
      setTimeout(() => goToDashboard(), 1200);
    } catch {
      goToDashboard();
    }
    setNotifLoading(false);
  };

  const goToDashboard = () => {
    localStorage.setItem("civiq_onboarding_done", "true");
    router.push("/dashboard");
  };
  
  const progress = stage === "quiz" ? ((step + 1) / QUESTIONS.length) * 100 : stage === "topics" ? 100 : 0;
  const current = QUESTIONS[step];

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, current.options[selected].value];
    setAnswers(newAnswers);
    setDirection(1);

    if (step < QUESTIONS.length - 1) {
      setSelected(null);
      setStep(step + 1);
    } else {
      setStage("topics");
      setSelected(null);
    }
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    const avg = answers.reduce(
      (acc, cur) => ({ x: acc.x + cur.x, y: acc.y + cur.y }),
      { x: 0, y: 0 }
    );
    const final = {
      x: avg.x / answers.length,
      y: avg.y / answers.length,
    };
    setResult(final);

    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compassPosition: final,
        topics: selectedTopics,
      }),
    });

    setSaving(false);
    setStage("result");
  };

  const base = {
    minHeight: "100vh",
    backgroundColor: "#06060c",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontFamily: "'DM Sans', sans-serif",
    color: "#fff",
    padding: "24px",
  };

  // WELCOME
  if (stage === "welcome") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
        `}</style>
        <div style={base}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}
          >
            <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "24px" }}>
              Welcome to Civiq
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "20px", lineHeight: "1.1", color: "#f0ede6" }}>
              Know where<br />you stand.
            </h1>
            <p style={{ fontSize: "16px", color: "#555", lineHeight: "1.7", marginBottom: "12px", maxWidth: "400px", margin: "0 auto 12px" }}>
              10 questions about real Ontario issues. No right or wrong answers — this helps us personalize your feed.
            </p>
            <p style={{ fontSize: "13px", color: "#555", marginBottom: "40px" }}>Takes about 2 minutes.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: "#f5a623", color: "#000", padding: "16px", borderRadius: "12px", fontWeight: "700", fontSize: "15px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => setStage("quiz")}
              >
                Start the quiz
              </motion.button>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#555", fontFamily: "'DM Sans', sans-serif", padding: "8px" }}
                onClick={async () => {
                  await fetch("/api/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ compassPosition: { x: 0, y: 0 }, topics: [] }),
                  });
                  goToDashboard();
                }}
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // RESULT
  if (stage === "result" && result) {
    const { label, color, desc } = getLabel(result.x, result.y);
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
        `}</style>
        <div style={base}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              style={{ fontSize: "56px", marginBottom: "24px" }}
            >
              🎯
            </motion.div>
            <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
              Your political compass
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: "clamp(28px, 6vw, 42px)", fontWeight: "800", color, letterSpacing: "-1px", marginBottom: "12px" }}
            >
              {label}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ fontSize: "15px", color: "#555", lineHeight: "1.7", marginBottom: "40px", maxWidth: "380px", margin: "0 auto 40px" }}
            >
              {desc} Your feed will reflect this — but you'll always see every perspective on Civiq.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backgroundColor: "#f5a623", color: "#000", padding: "16px 48px", borderRadius: "12px", fontWeight: "700", fontSize: "15px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              onClick={() => setStage("notifications")}
              >
              Go to my feed →
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // NOTIFICATIONS
  if (stage === "notifications") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
        `}</style>
        <div style={base}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              style={{ fontSize: "56px", marginBottom: "24px" }}
            >
              {notifDone ? "✅" : "🔔"}
            </motion.div>

            {notifDone ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "8px", color: "#f0ede6" }}>
                  You're all set
                </div>
                <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.7" }}>
                  Taking you to your feed...
                </div>
              </motion.div>
            ) : (
              <>
                <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
                  One last thing
                </div>
                <h2 style={{ fontSize: "clamp(24px, 5vw, 34px)", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "16px", lineHeight: "1.15", color: "#f0ede6" }}>
                  Stay in the loop on Ontario
                </h2>
                <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.75", marginBottom: "12px", maxWidth: "360px", margin: "0 auto 12px" }}>
                  Get a morning brief and evening update — what's happening in your province, no spin.
                </p>
                <p style={{ fontSize: "13px", color: "#444", marginBottom: "36px" }}>
                  Twice a day. Turn off anytime.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px", margin: "0 auto" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnableNotifications}
                    disabled={notifLoading}
                    style={{
                      backgroundColor: "#f5a623", color: "#000",
                      padding: "16px", borderRadius: "12px",
                      fontWeight: "700", fontSize: "15px",
                      border: "none", cursor: notifLoading ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: notifLoading ? 0.7 : 1,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {notifLoading ? "Enabling..." : "Enable notifications"}
                  </motion.button>
                  <button
                    onClick={goToDashboard}
                    disabled={notifLoading}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", fontSize: "13px",
                      color: "#444", fontFamily: "'DM Sans', sans-serif",
                      padding: "8px",
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </>
    );
  }

  // TOPICS
  if (stage === "topics") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
        `}</style>
        <div style={base}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: "100%", maxWidth: "520px" }}
          >
            <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
              Almost done
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "10px" }}>
              What issues matter most to you?
            </h2>
            <p style={{ fontSize: "14px", color: "#444", marginBottom: "32px", lineHeight: "1.6" }}>
              Pick as many as you want. We'll prioritize these in your feed.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "32px" }}>
              {TOPICS.map((topic, i) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleTopic(topic.id)}
                    style={{
                      padding: "18px 16px",
                      borderRadius: "14px",
                      border: isSelected ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: isSelected ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "12px",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "22px" }}>{topic.emoji}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: isSelected ? "#f5a623" : "#888" }}>{topic.label}</span>
                    {isSelected && <span style={{ marginLeft: "auto", fontSize: "14px" }}>✓</span>}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleFinish}
              disabled={saving}
              style={{
                width: "100%", padding: "16px", borderRadius: "12px",
                backgroundColor: "#f5a623", color: "#000",
                fontWeight: "700", fontSize: "15px", border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Setting up your feed..." : "See my results →"}
            </motion.button>

            <button
              onClick={handleFinish}
              disabled={saving}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#555", fontFamily: "'DM Sans', sans-serif", padding: "12px", width: "100%", marginTop: "4px" }}
            >
              Skip topic selection
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // QUIZ
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
      `}</style>
      <div style={base}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          {/* Progress */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Question {step + 1} of {QUESTIONS.length}
              </div>
              <div style={{ fontSize: "12px", color: "#555" }}>{Math.round(progress)}%</div>
            </div>
            <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", backgroundColor: "#f5a623", borderRadius: "10px" }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: "700", lineHeight: "1.35", letterSpacing: "-0.5px", marginBottom: "28px", color: "#f0ede6" }}>
                {current.question}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {current.options.map((opt, i) => {
                  const isSelected = selected === i;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelected(i)}
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        border: isSelected ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.07)",
                        backgroundColor: isSelected ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        fontSize: "15px",
                        fontWeight: "500",
                        color: isSelected ? "#f5a623" : "#aaa",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        fontFamily: "'DM Sans', sans-serif",
                        display: "flex", alignItems: "center", gap: "12px",
                      }}
                    >
                      <span style={{
                        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                        border: isSelected ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: "700",
                        color: isSelected ? "#f5a623" : "#444",
                        backgroundColor: isSelected ? "rgba(245,166,35,0.15)" : "transparent",
                      }}>
                        {isSelected ? "✓" : String.fromCharCode(65 + i)}
                      </span>
                      {opt.text}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileHover={selected !== null ? { scale: 1.01 } : {}}
            whileTap={selected !== null ? { scale: 0.99 } : {}}
            onClick={handleNext}
            disabled={selected === null}
            style={{
              marginTop: "24px", width: "100%", padding: "16px",
              borderRadius: "12px", border: "none",
              backgroundColor: selected !== null ? "#f5a623" : "rgba(255,255,255,0.04)",
              color: selected !== null ? "#000" : "#555",
              fontWeight: "700", fontSize: "15px",
              cursor: selected !== null ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {step === QUESTIONS.length - 1 ? "See my result →" : "Next →"}
          </motion.button>
        </div>
      </div>
    </>
  );
}
