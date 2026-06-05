"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

type QuestionData = {
  question: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number | null;
    explanation: string | null;
  };
  userAnswer: { answerIndex: number; correct: boolean } | null;
  distribution: number[];
  totalAnswers: number;
  date: string;
};

export default function DailyClient() {
  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; explanation: string } | null>(null);

const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.question) { setError(true); setLoading(false); return; }
        setData(d);
        if (d.userAnswer) {
          setSelected(d.userAnswer.answerIndex);
          setResult({
            correct: d.userAnswer.correct,
            correctIndex: d.question.correctIndex,
            explanation: d.question.explanation,
          });
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const handleSubmit = async () => {
    if (selected === null || !data || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: data.question.id, answerIndex: selected }),
      });
      const r = await res.json();
      setResult(r);
      // Refresh to get updated distribution
      const updated = await fetch("/api/daily").then(x => x.json());
      setData(updated);
    } catch {}
    setSubmitting(false);
  };

  const hasAnswered = !!result;
  const totalAnswers = data?.totalAnswers ?? 0;

  return (
    <AppLayout active="/daily">
      <style>{`
        @keyframes correctPulse { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 70% { box-shadow: 0 0 0 12px rgba(74,222,128,0); } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } }
        @keyframes wrongShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
      `}</style>
      <div style={{ padding: "40px 24px", maxWidth: "620px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "36px" }}
        >
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Daily Question
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>
            Today's Ontario Question
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            {new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </motion.div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                style={{ height: i === 1 ? "80px" : "56px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "14px" }}
              />
            ))}
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ fontSize: "15px", color: "#555" }}>Could not load today's question. Try again in a moment.</div>
          </div>
        )}
        
        {!loading && data && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: "20px", fontWeight: "700", lineHeight: "1.4",
                letterSpacing: "-0.3px", marginBottom: "28px", color: "#fff",
              }}
            >
              {data.question.question}
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {(data.question.options as string[]).map((option, i) => {
                const isSelected = selected === i;
                const isCorrect = result && i === result.correctIndex;
                const isWrong = result && isSelected && !result.correct;
                const pct = totalAnswers > 0 ? Math.round((data.distribution[i] / totalAnswers) * 100) : 0;

                let borderColor = "rgba(255,255,255,0.08)";
                let bgColor = "rgba(255,255,255,0.02)";
                let textColor = "#888";

                if (isCorrect && hasAnswered) { borderColor = "#4ade80"; bgColor = "rgba(74,222,128,0.08)"; textColor = "#4ade80"; }
                else if (isWrong) { borderColor = "#f87171"; bgColor = "rgba(248,113,113,0.08)"; textColor = "#f87171"; }
                else if (isSelected && !hasAnswered) { borderColor = "#f5a623"; bgColor = "rgba(245,166,35,0.08)"; textColor = "#f5a623"; }

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{
                      opacity: 1, x: 0,
                      animation: isCorrect && hasAnswered ? "correctPulse 0.6s ease" : isWrong ? "wrongShake 0.4s ease" : "none",
                    }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                    whileHover={!hasAnswered ? { scale: 1.01, borderColor: "#f5a623" } : {}}
                    whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                    onClick={() => !hasAnswered && setSelected(i)}
                    style={{
                      position: "relative",
                      padding: "16px 18px",
                      borderRadius: "14px",
                      border: `1px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      cursor: hasAnswered ? "default" : "pointer",
                      textAlign: "left",
                      fontFamily: "'DM Sans', sans-serif",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {hasAnswered && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          backgroundColor: isCorrect ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.02)",
                          borderRadius: "14px",
                        }}
                      />
                    )}
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                          border: `1px solid ${borderColor}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: "700", color: textColor,
                        }}>
                          {isCorrect && hasAnswered ? "✓" : isWrong ? "✗" : String.fromCharCode(65 + i)}
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: "500", color: textColor }}>{option}</span>
                      </div>
                      {hasAnswered && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          style={{ fontSize: "14px", fontWeight: "700", color: textColor, flexShrink: 0 }}
                        >{pct}%</motion.span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {!hasAnswered && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  whileHover={selected !== null ? { scale: 1.02, filter: "brightness(1.1)" } : {}}
                  whileTap={selected !== null ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={selected === null || submitting}
                  style={{
                    width: "100%", padding: "16px",
                    borderRadius: "14px", border: "none",
                    backgroundColor: selected !== null ? "#f5a623" : "rgba(255,255,255,0.04)",
                    color: selected !== null ? "#000" : "#555",
                    fontSize: "15px", fontWeight: "700",
                    cursor: selected !== null ? "pointer" : "not-allowed",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Answer"}
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    marginTop: "20px",
                    padding: "20px 22px",
                    borderRadius: "16px",
                    border: `1px solid ${result.correct ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                    backgroundColor: result.correct ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)",
                  }}
                >
                  <div style={{
                    fontSize: "16px", fontWeight: "800",
                    color: result.correct ? "#4ade80" : "#f87171",
                    marginBottom: "10px",
                    letterSpacing: "-0.3px",
                  }}>
                    {result.correct ? "✓ Correct!" : "✗ Not quite"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#888", lineHeight: "1.7" }}>
                    {result.explanation}
                  </div>
                    <div style={{ marginTop: "14px", fontSize: "12px", color: "#666" }}>
                    {totalAnswers} {totalAnswers === 1 ? "person has" : "people have"} answered today
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#555" }}
              >
                Come back tomorrow for a new question
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
