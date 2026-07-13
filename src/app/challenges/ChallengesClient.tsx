"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { Newspaper, BookOpen, Vote, NotebookPen, Flame, Award, CheckCircle2 } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  completed: boolean;
};

type ChallengesData = {
  weekStart: string;
  challenges: Challenge[];
  allCompleted: boolean;
  streak: number;
  completedCount: number;
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; link: string; linkLabel: string }> = {
  read: { icon: Newspaper, color: "#60a5fa", link: "/dashboard", linkLabel: "Go to feed" },
  learn: { icon: BookOpen, color: "#a78bfa", link: "/learn", linkLabel: "Go to learn" },
  vote: { icon: Vote, color: "#4ade80", link: "/polls", linkLabel: "Go to polls" },
  opinion: { icon: NotebookPen, color: "#f5a623", link: "/opinions", linkLabel: "Go to opinions" },
};

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function ChallengesClient() {
  const [data, setData] = useState<ChallengesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [, setShowBadge] = useState(false);

  useEffect(() => {
    fetch("/api/challenges")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const complete = async (challengeId: string) => {
    if (completing) return;
    setCompleting(challengeId);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const result = await res.json();
      if (result.success) {
        setJustCompleted(challengeId);
        setData(prev => {
          if (!prev) return prev;
          const updated = prev.challenges.map(c =>
            c.id === challengeId ? { ...c, completed: true } : c
          );
          const completedCount = updated.filter(c => c.completed).length;
          const allCompleted = updated.every(c => c.completed);
          if (allCompleted && !prev.allCompleted) setShowBadge(true);
          return { ...prev, challenges: updated, completedCount, allCompleted };
        });
        setTimeout(() => setJustCompleted(null), 2000);
      }
    } catch {}
    setCompleting(null);
  };

  const progressPct = data ? (data.completedCount / 3) * 100 : 0;

  return (
    <AppLayout active="/challenges">
      <div style={{
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: "100px",
        }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", marginBottom: "8px" }}>
              Weekly Challenges
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#f0ede6", letterSpacing: "-0.5px", margin: 0, lineHeight: 1.2 }}>
              This Week&apos;s Missions
            </h1>
            <div style={{ fontSize: "13px", color: "#555", marginTop: "8px" }}>
              Resets Monday · Next drop {getNextMonday()}
            </div>
          </div>

          {/* Streak + Progress */}
          {data && (
            <div style={{
              display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap",
            }}>
              <div style={{
                flex: 1, minWidth: "140px",
                backgroundColor: "rgba(245,166,35,0.06)",
                border: "1px solid rgba(245,166,35,0.15)",
                borderRadius: "14px", padding: "14px 16px",
              }}>
                <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                  Challenge Streak
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f5a623" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Flame size={22} />{data.streak}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  week{data.streak !== 1 ? "s" : ""} in a row
                </div>
              </div>

              <div style={{
                flex: 1, minWidth: "140px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px", padding: "14px 16px",
              }}>
                <div style={{ fontSize: "11px", color: "#888", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                  This Week
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f0ede6" }}>
                  {data.completedCount}/3
                </div>
                <div style={{ marginTop: "8px", height: "4px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ height: "100%", backgroundColor: "#f5a623", borderRadius: "4px" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* All done badge */}
          <AnimatePresence>
            {data?.allCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  marginBottom: "24px",
                  padding: "16px 20px",
                  backgroundColor: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.25)",
                  borderRadius: "16px",
                  display: "flex", alignItems: "center", gap: "12px",
                }}
              >
                <Award size={28} color="#f5a623" />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#f5a623" }}>
                    Weekly badge earned!
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                    You completed all 3 challenges this week. Come back Monday for the next set.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Challenges */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: "120px", borderRadius: "16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animation: "shimmer 1.5s infinite",
                }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data?.challenges.map((challenge, i) => {
                const meta = TYPE_META[challenge.type] ?? TYPE_META.read;
                const isDone = challenge.completed;
                const isCompleting = completing === challenge.id;
                const wasJustCompleted = justCompleted === challenge.id;

                return (
                  <div
                    key={challenge.id}
                    style={{
                      backgroundColor: isDone ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
                      border: isDone
                        ? `1px solid ${meta.color}30`
                        : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "16px",
                      padding: "18px",
                      position: "relative",
                      overflow: "hidden",
                      opacity: isDone ? 0.7 : 1,
                    }}
                  >
                    {isDone && (
                      <div style={{
                        position: "absolute", top: "14px", right: "14px",
                        width: "24px", height: "24px", borderRadius: "50%",
                        backgroundColor: meta.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px",
                      }}>
                        ✓
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                        backgroundColor: `${meta.color}15`,
                        border: `1px solid ${meta.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px",
                      }}>
                        <meta.icon size={20} color={meta.color} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: isDone ? "#555" : "#f0ede6" }}>
                            {challenge.title}
                          </div>
                          <div style={{
                            fontSize: "10px", fontWeight: "700",
                            color: meta.color,
                            backgroundColor: `${meta.color}15`,
                            padding: "2px 8px", borderRadius: "100px",
                            letterSpacing: "0.06em",
                          }}>
                            +{challenge.xpReward} XP
                          </div>
                        </div>

                        <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.5", marginBottom: "12px" }}>
                          {challenge.description}
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          {!isDone && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => complete(challenge.id)}
                              disabled={isCompleting}
                              style={{
                                fontSize: "12px", fontWeight: "700",
                                color: "#000",
                                backgroundColor: isCompleting ? "#888" : meta.color,
                                border: "none", borderRadius: "8px",
                                padding: "7px 16px", cursor: isCompleting ? "not-allowed" : "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "background-color 0.2s",
                              }}
                            >
                              {isCompleting ? "Marking..." : "Mark complete"}
                            </motion.button>
                          )}

                          <Link
                            href={meta.link}
                            style={{
                              fontSize: "12px", fontWeight: "600",
                              color: meta.color,
                              backgroundColor: `${meta.color}10`,
                              border: `1px solid ${meta.color}20`,
                              borderRadius: "8px", padding: "7px 14px",
                              textDecoration: "none",
                            }}
                          >
                            {meta.linkLabel} →
                          </Link>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {wasJustCompleted && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: "absolute", inset: 0,
                            backgroundColor: `${meta.color}10`,
                            borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "32px",
                          }}
                        ><CheckCircle2 size={32} color={meta.color} /></motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info footer */}
          <div style={{
            marginTop: "32px", padding: "16px",
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "14px",
            fontSize: "12px", color: "#444", lineHeight: "1.7",
          }}>
            Challenges drop every Monday. Complete all 3 to earn your weekly badge and extend your streak. Challenges are designed to push you outside your political comfort zone.
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}



