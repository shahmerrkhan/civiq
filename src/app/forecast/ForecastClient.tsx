"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

type MyPrediction = {
  id: string;
  prediction: boolean;
  confidence: number;
  pointsEarned: number | null;
};

type Question = {
  id: string;
  question: string;
  context: string;
  category: string;
  status: string;
  closesAt: string;
  resolvesAt: string;
  outcome: boolean | null;
  outcomeExplanation: string | null;
  weekStart: string;
  yesCount: number;
  noCount: number;
  total: number;
  yesPct: number;
  noPct: number;
  myPrediction: MyPrediction | null;
};

type LeaderboardEntry = {
  userId: string;
  username: string;
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#a78bfa",
  Healthcare: "#f87171",
  Education: "#f59e0b",
  Environment: "#34d399",
  Economy: "#4ade80",
  Politics: "#60a5fa",
  Courts: "#fb923c",
};

function timeLeft(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function accuracyLabel(correct: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((correct / total) * 100)}%`;
}

export default function ForecastClient({ userId }: { userId: string | null }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "resolved" | "leaderboard">("open");
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [predicting, setPredicting] = useState<string | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<boolean | null>(null);
  const [pendingConfidence, setPendingConfidence] = useState(75);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/forecast")
      .then(r => r.json())
      .then(data => {
        setQuestions(data.questions ?? []);
        setLeaderboard(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function submitPrediction(questionId: string) {
    if (pendingPrediction === null || !userId) return;
    setSubmitting(true);

    const res = await fetch("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        prediction: pendingPrediction,
        confidence: pendingConfidence,
      }),
    });

    if (res.ok) {
      const updated = await fetch("/api/forecast").then(r => r.json());
      setQuestions(updated.questions ?? []);
      setLeaderboard(updated.leaderboard ?? []);
      setPredicting(null);
      setPendingPrediction(null);
      setPendingConfidence(75);
    }
    setSubmitting(false);
  }

  const openQs = questions.filter(q => q.status === "open");
  const closedQs = questions.filter(q => q.status === "closed");
  const resolvedQs = questions.filter(q => q.status === "resolved");

  const main: React.CSSProperties = {
    flex: 1,
    padding: "32px 40px",
    maxWidth: "800px",
  };

  if (loading) {
    return (
      <AppLayout active="/forecast">
        <div style={{ ...main, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔮</div>
            <div style={{ color: "#444", fontSize: "14px" }}>Loading forecasts...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout active="/forecast">
      <style>{`
        .forecast-card:hover { border-color: rgba(245,166,35,0.2) !important; }
        .tab-btn:hover { color: #fff !important; }
        .pred-btn:hover { opacity: 0.85 !important; }
        .lb-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      <div style={main}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "28px" }}>🔮</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              Civic Forecast
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: "1.6" }}>
            Predict what happens in Ontario politics. The more confident and correct you are, the more points you earn.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0" }}>
          {([
            { key: "open", label: `Open (${openQs.length})` },
            { key: "resolved", label: `Resolved (${resolvedQs.length + closedQs.length})` },
            { key: "leaderboard", label: "Leaderboard" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #f5a623" : "2px solid transparent",
                color: activeTab === tab.key ? "#f5a623" : "#444",
                fontWeight: activeTab === tab.key ? "700" : "500",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s ease",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Open Questions */}
        {activeTab === "open" && (
          <div>
            {openQs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}>
                New predictions generate every Monday. Check back soon.
              </div>
            ) : (
              openQs.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  userId={userId}
                  activeQuestion={activeQuestion}
                  setActiveQuestion={setActiveQuestion}
                  predicting={predicting}
                  setPredicting={setPredicting}
                  pendingPrediction={pendingPrediction}
                  setPendingPrediction={setPendingPrediction}
                  pendingConfidence={pendingConfidence}
                  setPendingConfidence={setPendingConfidence}
                  submitting={submitting}
                  onSubmit={submitPrediction}
                />
              ))
            )}
          </div>
        )}

        {/* Resolved + Closed */}
        {activeTab === "resolved" && (
          <div>
            {[...resolvedQs, ...closedQs].length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}>
                No resolved predictions yet.
              </div>
            ) : (
              [...resolvedQs, ...closedQs].map(q => (
                <ResolvedCard key={q.id} question={q} />
              ))
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === "leaderboard" && (
          <div>
            <div style={{
              backgroundColor: "rgba(245,166,35,0.04)",
              border: "1px solid rgba(245,166,35,0.1)",
              borderRadius: "14px",
              padding: "20px 24px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "13px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                How scoring works
              </div>
              <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.7" }}>
                Correct prediction = your confidence % as points (50–100). Wrong = 0. Being confident and right earns more. Being confident and wrong costs nothing — but playing it safe earns less.
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#333", fontSize: "14px" }}>
                No predictions scored yet.
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <div
                  key={entry.userId}
                  className="lb-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    marginBottom: "8px",
                    transition: "background 0.15s ease",
                    backgroundColor: i === 0 ? "rgba(245,166,35,0.05)" : "transparent",
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: i < 3 ? ["rgba(245,166,35,0.15)", "rgba(150,150,150,0.15)", "rgba(180,100,50,0.15)"][i] : "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "800",
                    color: i < 3 ? ["#f5a623", "#aaa", "#cd7f32"][i] : "#444",
                    flexShrink: 0,
                  }}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: i === 0 ? "#f5a623" : "#ddd", marginBottom: "2px" }}>
                      {entry.username}
                    </div>
                    <div style={{ fontSize: "12px", color: "#444" }}>
                      {entry.correctPredictions}/{entry.totalPredictions} correct · {accuracyLabel(entry.correctPredictions, entry.totalPredictions)} accuracy
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#f5a623", letterSpacing: "-0.5px" }}>
                      {entry.totalPoints}
                    </div>
                    <div style={{ fontSize: "11px", color: "#333" }}>pts</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({
  question, userId, activeQuestion, setActiveQuestion,
  predicting, setPredicting, pendingPrediction, setPendingPrediction,
  pendingConfidence, setPendingConfidence, submitting, onSubmit,
}: {
  question: Question;
  userId: string | null;
  activeQuestion: string | null;
  setActiveQuestion: (id: string | null) => void;
  predicting: string | null;
  setPredicting: (id: string | null) => void;
  pendingPrediction: boolean | null;
  setPendingPrediction: (v: boolean | null) => void;
  pendingConfidence: number;
  setPendingConfidence: (v: number) => void;
  submitting: boolean;
  onSubmit: (id: string) => void;
}) {
  const expanded = activeQuestion === question.id;
  const isPredicting = predicting === question.id;
  const catColor = CATEGORY_COLORS[question.category] ?? "#f5a623";
  const hasPredicted = !!question.myPrediction;

  return (
    <motion.div
      className="forecast-card"
      layout
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "14px",
        cursor: "pointer",
        transition: "border-color 0.2s ease",
      }}
      onClick={() => {
        if (!isPredicting) setActiveQuestion(expanded ? null : question.id);
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", fontWeight: "700", color: catColor,
              backgroundColor: `${catColor}15`, padding: "3px 10px",
              borderRadius: "100px", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              {question.category}
            </span>
            <span style={{ fontSize: "12px", color: "#333" }}>
              {timeLeft(question.closesAt)}
            </span>
            {hasPredicted && (
              <span style={{
                fontSize: "11px", fontWeight: "700",
                color: question.myPrediction!.prediction ? "#4ade80" : "#f87171",
                backgroundColor: question.myPrediction!.prediction ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                padding: "3px 10px", borderRadius: "100px",
              }}>
                You: {question.myPrediction!.prediction ? "YES" : "NO"} · {question.myPrediction!.confidence}% confident
              </span>
            )}
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "-0.2px", lineHeight: "1.4", color: "#f0ede6" }}>
            {question.question}
          </div>
        </div>
      </div>

      {/* Vote bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", marginBottom: "6px" }}>
          <span style={{ color: "#4ade80", fontWeight: "600" }}>YES {question.yesPct}%</span>
          <span style={{ color: "#444" }}>{question.total} prediction{question.total !== 1 ? "s" : ""}</span>
          <span style={{ color: "#f87171", fontWeight: "600" }}>{question.noPct}% NO</span>
        </div>
        <div style={{ height: "6px", borderRadius: "100px", backgroundColor: "rgba(248,113,113,0.2)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${question.yesPct}%`,
            backgroundColor: "#4ade80",
            borderRadius: "100px",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Expanded context */}
      <AnimatePresence>
        {expanded && !isPredicting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              marginTop: "8px",
            }}>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.7", marginBottom: "16px" }}>
                {question.context}
              </p>
              {!hasPredicted ? (
                userId ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPredicting(question.id); setPendingPrediction(null); }}
                    style={{
                      backgroundColor: "#f5a623",
                      color: "#000",
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Make your prediction →
                  </button>
                ) : (
                  <Link href="/sign-in" style={{ color: "#f5a623", fontSize: "14px", fontWeight: "600" }}>
                    Sign in to predict →
                  </Link>
                )
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setPredicting(question.id); setPendingPrediction(question.myPrediction!.prediction); setPendingConfidence(question.myPrediction!.confidence); }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#888",
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Change your prediction
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction input */}
      <AnimatePresence>
        {isPredicting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px", fontWeight: "600" }}>
                Will this happen?
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                {[true, false].map(val => (
                  <motion.button
                    key={String(val)}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPendingPrediction(pendingPrediction === val ? null : val)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "12px",
                      border: pendingPrediction === val
                        ? `1px solid ${val ? "#4ade80" : "#f87171"}`
                        : "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: pendingPrediction === val
                        ? val ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"
                        : "rgba(255,255,255,0.02)",
                      color: pendingPrediction === val
                        ? val ? "#4ade80" : "#f87171"
                        : "#555",
                      fontWeight: "800",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {val ? "YES" : "NO"}
                  </motion.button>
                ))}
              </div>

              {pendingPrediction !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", color: "#555", fontWeight: "600" }}>
                      Confidence
                    </span>
                    <motion.span
                      key={pendingConfidence}
                      initial={{ scale: 1.15, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        fontSize: "15px",
                        fontWeight: "800",
                        color: pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#888",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {pendingConfidence}%
                    </motion.span>
                  </div>

                  {/* Custom styled slider track */}
                  <div style={{ position: "relative", marginBottom: "14px" }}>
                    <style>{`
                      .conf-slider {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 6px;
                        border-radius: 100px;
                        outline: none;
                        cursor: pointer;
                        background: linear-gradient(
                          to right,
                          ${pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#60a5fa"} 0%,
                          ${pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#60a5fa"} ${((pendingConfidence - 50) / 50) * 100}%,
                          rgba(255,255,255,0.07) ${((pendingConfidence - 50) / 50) * 100}%,
                          rgba(255,255,255,0.07) 100%
                        );
                      }
                      .conf-slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: ${pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#60a5fa"};
                        border: 2px solid rgba(0,0,0,0.4);
                        box-shadow: 0 0 8px ${pendingConfidence >= 85 ? "rgba(245,166,35,0.5)" : pendingConfidence >= 70 ? "rgba(167,139,250,0.5)" : "rgba(96,165,250,0.5)"};
                        cursor: pointer;
                        transition: box-shadow 0.15s ease, background 0.15s ease;
                      }
                      .conf-slider::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: ${pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#60a5fa"};
                        border: 2px solid rgba(0,0,0,0.4);
                        box-shadow: 0 0 8px ${pendingConfidence >= 85 ? "rgba(245,166,35,0.5)" : pendingConfidence >= 70 ? "rgba(167,139,250,0.5)" : "rgba(96,165,250,0.5)"};
                        cursor: pointer;
                      }
                      .conf-slider::-webkit-slider-thumb:hover {
                        box-shadow: 0 0 14px ${pendingConfidence >= 85 ? "rgba(245,166,35,0.7)" : pendingConfidence >= 70 ? "rgba(167,139,250,0.7)" : "rgba(96,165,250,0.7)"};
                      }
                    `}</style>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={pendingConfidence}
                      onChange={e => setPendingConfidence(Number(e.target.value))}
                      className="conf-slider"
                    />
                    {/* tick labels */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                      {[50, 60, 70, 80, 90, 100].map(v => (
                        <span key={v} style={{
                          fontSize: "10px",
                          color: pendingConfidence >= v ? (v >= 85 ? "#f5a623" : v >= 70 ? "#a78bfa" : "#60a5fa") : "#2a2a2a",
                          fontWeight: "700",
                          transition: "color 0.15s ease",
                        }}>{v}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    fontSize: "12px",
                    marginBottom: "16px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: pendingConfidence >= 85 ? "rgba(245,166,35,0.06)" : pendingConfidence >= 70 ? "rgba(167,139,250,0.06)" : "rgba(96,165,250,0.06)",
                    border: `1px solid ${pendingConfidence >= 85 ? "rgba(245,166,35,0.12)" : pendingConfidence >= 70 ? "rgba(167,139,250,0.12)" : "rgba(96,165,250,0.12)"}`,
                    color: pendingConfidence >= 85 ? "#f5a623" : pendingConfidence >= 70 ? "#a78bfa" : "#60a5fa",
                    fontWeight: "600",
                    transition: "all 0.15s ease",
                  }}>
                    {pendingConfidence >= 85
                      ? `🔥 High conviction — ${pendingConfidence} pts if you're right`
                      : pendingConfidence >= 70
                      ? `💡 Moderate confidence — ${pendingConfidence} pts if correct`
                      : `🎲 Low confidence — ${pendingConfidence} pts if correct`}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => onSubmit(question.id)}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        backgroundColor: "#f5a623",
                        color: "#000",
                        padding: "13px",
                        borderRadius: "10px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: submitting ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? "Saving..." : "Lock it in →"}
                    </button>
                    <button
                      onClick={() => { setPredicting(null); setPendingPrediction(null); }}
                      style={{
                        padding: "13px 20px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "10px",
                        color: "#555",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Resolved Card ────────────────────────────────────────────────────────────
function ResolvedCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[question.category] ?? "#f5a623";
  const outcomeColor = question.status === "resolved"
    ? (question.outcome ? "#4ade80" : "#f87171")
    : "#facc15";

  const myPred = question.myPrediction;
  const correct = myPred && question.outcome !== null && myPred.prediction === question.outcome;

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "14px",
        cursor: "pointer",
        opacity: 0.85,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", fontWeight: "700", color: catColor,
              backgroundColor: `${catColor}15`, padding: "3px 10px",
              borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {question.category}
            </span>
            <span style={{
              fontSize: "11px", fontWeight: "700",
              color: outcomeColor,
              backgroundColor: `${outcomeColor}15`,
              padding: "3px 10px", borderRadius: "100px",
            }}>
              {question.status === "resolved"
                ? (question.outcome ? "YES — resolved" : "NO — resolved")
                : "Awaiting resolution"}
            </span>
            {myPred && question.status === "resolved" && (
              <span style={{
                fontSize: "11px", fontWeight: "700",
                color: correct ? "#4ade80" : "#f87171",
                backgroundColor: correct ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                padding: "3px 10px", borderRadius: "100px",
              }}>
                {correct ? `+${myPred.pointsEarned} pts ✓` : "0 pts ✗"}
              </span>
            )}
          </div>
          <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.2px", lineHeight: "1.4", color: "#999" }}>
            {question.question}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "12px" }}>
              {question.outcomeExplanation && (
                <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.7", marginBottom: "12px" }}>
                  {question.outcomeExplanation}
                </p>
              )}
              <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#444" }}>
                <span>YES: {question.yesPct}%</span>
                <span>NO: {question.noPct}%</span>
                <span>{question.total} predictions</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




