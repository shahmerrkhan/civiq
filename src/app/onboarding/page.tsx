"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: 1,
    question: "Your city needs money. What should the government cut first?",
    options: [
      { text: "Corporate subsidies", value: { x: -1, y: 0 } },
      { text: "Public services like transit", value: { x: 1, y: 0 } },
      { text: "Military and police budgets", value: { x: -0.5, y: -1 } },
      { text: "Foreign aid", value: { x: 0.5, y: 0 } },
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

function getLabel(x: number, y: number) {
  if (x < -0.15 && y < -0.15) return { label: "Left Libertarian", color: "#4ade80" };
  if (x < -0.15 && y >= -0.15) return { label: "Left Leaning", color: "#60a5fa" };
  if (x > 0.15 && y < -0.15) return { label: "Right Libertarian", color: "#f59e0b" };
  if (x > 0.15 && y >= -0.15) return { label: "Right Leaning", color: "#f87171" };
  if (x < -0.05) return { label: "Centre Left", color: "#818cf8" };
  if (x > 0.05) return { label: "Centre Right", color: "#fb923c" };
  return { label: "Centrist", color: "#a78bfa" };
}

export default function Onboarding() {
  const router = useRouter();
    const [started, setStarted] = useState(false);
const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ x: number; y: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ x: number; y: number } | null>(null);

  const progress = (step / QUESTIONS.length) * 100;
  const current = QUESTIONS[step];

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, current.options[selected].value];

    if (step < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setSelected(null);
      setStep(step + 1);
    } else {
      setSaving(true);
      const avg = newAnswers.reduce(
        (acc, cur) => ({ x: acc.x + cur.x, y: acc.y + cur.y }),
        { x: 0, y: 0 }
      );
      const final = {
        x: avg.x / newAnswers.length,
        y: avg.y / newAnswers.length,
      };
      setResult(final);

      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compassPosition: final }),
      });

      setSaving(false);
      setDone(true);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    root: {
      minHeight: "100vh",
      backgroundColor: "#06060c",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      color: "#fff",
      padding: "24px",
    },
    container: {
      width: "100%",
      maxWidth: "600px",
    },
    progressBar: {
      width: "100%",
      height: "3px",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: "10px",
      marginBottom: "48px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      width: `${progress}%`,
      backgroundColor: "#f5a623",
      borderRadius: "10px",
      transition: "width 0.4s ease",
    },
    step: {
      fontSize: "12px",
      color: "#444",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "16px",
    },
    question: {
      fontSize: "clamp(22px, 4vw, 30px)",
      fontWeight: "700",
      lineHeight: "1.3",
      letterSpacing: "-0.5px",
      marginBottom: "36px",
      color: "#ffffff",
    },
    options: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    option: (isSelected: boolean): React.CSSProperties => ({
      padding: "18px 22px",
      borderRadius: "12px",
      border: isSelected ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.07)",
      backgroundColor: isSelected ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "500",
      color: isSelected ? "#f5a623" : "#aaa",
      transition: "all 0.2s ease",
      textAlign: "left",
    }),
    nextBtn: {
      marginTop: "28px",
      width: "100%",
      padding: "16px",
      borderRadius: "10px",
      backgroundColor: selected !== null ? "#f5a623" : "rgba(255,255,255,0.04)",
      color: selected !== null ? "#000" : "#333",
      fontWeight: "700",
      fontSize: "15px",
      border: "none",
      cursor: selected !== null ? "pointer" : "not-allowed",
      transition: "all 0.2s ease",
      fontFamily: "'DM Sans', sans-serif",
    },
    resultBox: {
      textAlign: "center",
      animation: "fadeUp 0.6s ease forwards",
    },
    resultLabel: (color: string): React.CSSProperties => ({
      fontSize: "36px",
      fontWeight: "800",
      color,
      letterSpacing: "-1px",
      marginBottom: "12px",
    }),
    resultSub: {
      fontSize: "16px",
      color: "#555",
      marginBottom: "40px",
      lineHeight: "1.6",
    },
    dashBtn: {
      backgroundColor: "#f5a623",
      color: "#000",
      padding: "16px 40px",
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "15px",
      border: "none",
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
  };

  if (done && result) {
    const { label, color } = getLabel(result.x, result.y);
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { margin:0; padding:0; box-sizing:border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={styles.root}>
          <div style={{ ...styles.container, ...styles.resultBox }}>
            <p style={{ fontSize: "13px", color: "#444", marginBottom: "24px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>Your political compass</p>
            <div style={styles.resultLabel(color)}>{label}</div>
            <p style={styles.resultSub}>This is just a starting point. Your feed and learning path will reflect this — but you can always explore every perspective on Civiq.</p>
            <button style={styles.dashBtn} onClick={() => router.push("/dashboard")}>Go to my dashboard</button>
          </div>
        </div>
      </>
    );
  }
if (!started) {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { margin:0; padding:0; box-sizing:border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={styles.root}>
        <div style={{ ...styles.container, textAlign: "center", animation: "fadeUp 0.6s ease forwards" }}>
          <p style={{ fontSize: "13px", color: "#f5a623", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "24px" }}>Welcome to Civiq</p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "800", letterSpacing: "-1.5px", marginBottom: "20px", lineHeight: "1.1" }}>Let's figure out where you stand</h1>
          <p style={{ fontSize: "16px", color: "#555", lineHeight: "1.7", marginBottom: "16px", maxWidth: "440px", margin: "0 auto 16px" }}>
            10 quick questions about real Ontario issues. No wrong answers — this just helps us personalize your feed.
          </p>
          <p style={{ fontSize: "13px", color: "#333", marginBottom: "48px" }}>Takes about 2 minutes. You can always change this later.</p>
          <button
            style={{ backgroundColor: "#f5a623", color: "#000", padding: "16px 40px", borderRadius: "10px", fontWeight: "700", fontSize: "15px", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            onClick={() => setStarted(true)}
          >
            Start the quiz
          </button>
          <p style={{ marginTop: "16px", fontSize: "13px", color: "#333" }}>or <span style={{ color: "#f5a623", cursor: "pointer", textDecoration: "underline" }} onClick={async () => {
  await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compassPosition: { x: 0, y: 0 } }),
  });
  router.push("/dashboard");
}}>skip for now
        </span></p>
        </div>
      </div>
    </>
  );
}

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { margin:0; padding:0; box-sizing:border-box; } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
          <p style={styles.step}>Question {step + 1} of {QUESTIONS.length}</p>
          <p style={styles.question}>{current.question}</p>
          <div style={styles.options}>
            {current.options.map((opt, i) => (
              <button
                key={i}
                style={styles.option(selected === i)}
                onClick={() => setSelected(i)}
              >
                {opt.text}
              </button>
            ))}
          </div>
          <button style={styles.nextBtn} onClick={handleNext} disabled={selected === null || saving}>
            {saving ? "Saving..." : step === QUESTIONS.length - 1 ? "See my result" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}