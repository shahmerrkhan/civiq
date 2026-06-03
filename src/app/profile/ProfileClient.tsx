"use client";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

function getLabel(x: number, y: number) {
  if (x < -0.15 && y < -0.15) return { label: "Left Libertarian", color: "#4ade80" };
  if (x < -0.15 && y >= -0.15) return { label: "Left Leaning", color: "#60a5fa" };
  if (x > 0.15 && y < -0.15) return { label: "Right Libertarian", color: "#f59e0b" };
  if (x > 0.15 && y >= -0.15) return { label: "Right Leaning", color: "#f87171" };
  if (x < -0.05) return { label: "Centre Left", color: "#818cf8" };
  if (x > 0.05) return { label: "Centre Right", color: "#fb923c" };
  return { label: "Centrist", color: "#a78bfa" };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function ProfileClient({
  name, email, imageUrl, compassPosition,
  streakCount, civicScore, opinions, pollsVoted, modulesCompleted,
}: {
  name: string;
  email: string;
  imageUrl: string;
  compassPosition: { x: number; y: number } | null;
  streakCount: number;
  civicScore: number;
  opinions: { id: string; opinion: string; cardId: string; createdAt: string }[];
  pollsVoted: number;
  modulesCompleted: number;
}) {
  function getCivicLabel(score: number) {
    if (score >= 500) return { label: "Civic Champion", color: "#f5a623" };
    if (score >= 300) return { label: "Political Junkie", color: "#a78bfa" };
    if (score >= 150) return { label: "Informed Citizen", color: "#60a5fa" };
    if (score >= 50) return { label: "Getting Engaged", color: "#4ade80" };
    return { label: "Just Starting", color: "#555" };
  }
  const { label: scoreLabel, color: scoreColor } = getCivicLabel(civicScore);
  const skipped = !compassPosition || (compassPosition.x === 0 && compassPosition.y === 0);
  const { label, color } = compassPosition
    ? getLabel(compassPosition.x, compassPosition.y)
    : { label: "Not taken yet", color: "#333" };

  useEffect(() => {
    fetch("/api/streak", { method: "POST" });
  }, []);
const stats = [
    { label: "Day Streak", value: streakCount, icon: "🔥", color: "#f5a623" },
    { label: "Polls Voted", value: pollsVoted, icon: "🗳️", color: "#60a5fa" },
    { label: "Modules Done", value: modulesCompleted, icon: "📚", color: "#4ade80" },
    { label: "Opinions Logged", value: opinions.length, icon: "💬", color: "#a78bfa" },
  ];

  return (
    <AppLayout active="/profile">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card:hover { background-color: rgba(255,255,255,0.05) !important; transform: translateY(-2px); }
        .stat-card { transition: all 0.2s ease; }
      `}</style>
<div style={{ padding: "40px 24px", maxWidth: "820px", width: "100%", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}
        >
          {imageUrl ? (
            <img src={imageUrl} style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(245,166,35,0.3)" }} />
          ) : (
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(245,166,35,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#f5a623" }}>
              {name[0]}
            </div>
          )}
          <div>
            <div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>{name}</div>
            <div style={{ fontSize: "13px", color: "#444", marginTop: "2px" }}>{email}</div>
          </div>
        </motion.div>

        {/* Civic Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: `1px solid ${scoreColor}25`,
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Civic Score</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <div style={{ fontSize: "42px", fontWeight: "800", color: scoreColor, letterSpacing: "-2px", lineHeight: 1 }}>{civicScore}</div>
              <div style={{ fontSize: "14px", color: scoreColor, fontWeight: "600" }}>{scoreLabel}</div>
            </div>
            <div style={{ fontSize: "12px", color: "#333", marginTop: "8px" }}>
              +20 per module · +10 per poll · +15 per opinion · +25 daily correct
            </div>
          </div>
          <div style={{ fontSize: "48px", opacity: 0.6 }}>🏛️</div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "28px" }}

          >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px",
                padding: "18px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{stat.icon}</div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: stat.color, letterSpacing: "-1px" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", marginTop: "4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Compass */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px" }}
        >
          <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>Political Compass</div>
          {skipped ? (
            <div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#555", marginBottom: "8px" }}>Not taken yet</div>
              <Link href="/onboarding" style={{ fontSize: "13px", color: "#f5a623", textDecoration: "none", fontWeight: "600" }}>Take the quiz →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "26px", fontWeight: "800", color, letterSpacing: "-0.5px", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "13px", color: "#444" }}>Based on your onboarding quiz</div>
              </div>
              <Link href="/onboarding" style={{ fontSize: "12px", color: "#444", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: "8px" }}>Retake quiz</Link>
            </div>
          )}
        </motion.div>

        {/* Opinion Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px 28px" }}
        >
          <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Your Opinion Timeline</div>

          {opinions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
              <div style={{ fontSize: "15px", color: "#555", marginBottom: "8px" }}>No opinions logged yet</div>
              <div style={{ fontSize: "13px", color: "#333" }}>When you read a feed card and log your take, it shows up here.</div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "7px", top: 0, bottom: 0, width: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
              {opinions.map((op, i) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  style={{ display: "flex", gap: "20px", marginBottom: "24px", position: "relative" }}
                >
                  <div style={{ width: "15px", height: "15px", borderRadius: "50%", backgroundColor: "#a78bfa", border: "2px solid #06060c", flexShrink: 0, marginTop: "3px", position: "relative", zIndex: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: "#555", marginBottom: "6px", fontWeight: "500" }}>{timeAgo(op.createdAt)}</div>
                    <div style={{ fontSize: "14px", color: "#ccc", lineHeight: "1.6", backgroundColor: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.1)", borderRadius: "10px", padding: "12px 16px" }}>
                      "{op.opinion}"
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </AppLayout>
  );
}