"use client";
import { useEffect, useState, useRef } from "react";
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
    : { label: "Not taken yet", color: "#555" };

    const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareReady, setShareReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generateShareCard = async () => {
    if (skipped) return;
    setSharing(true);
    await new Promise(r => setTimeout(r, 50)); // yield to UI before blocking canvas work
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d")!;

    // background
    ctx.fillStyle = "#06060c";
    ctx.fillRect(0, 0, 1080, 1080);

    // subtle grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 1080; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    // amber glow top-left
    const glow = ctx.createRadialGradient(200, 200, 0, 200, 200, 500);
    glow.addColorStop(0, "rgba(245,166,35,0.10)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1080);

    // top label
    ctx.fillStyle = "#f5a623";
    ctx.font = "600 22px sans-serif";
    ctx.fillText("CIVIQ · POLITICAL COMPASS", 80, 100);

    // divider
    ctx.strokeStyle = "rgba(245,166,35,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 120); ctx.lineTo(1000, 120); ctx.stroke();

    // big label
    ctx.fillStyle = color;
    ctx.font = "800 112px sans-serif";
    ctx.fillText(label, 80, 320);

    // sub
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "400 32px sans-serif";
    ctx.fillText("based on Ontario issues · no spin · no sides", 80, 390);

    // stats row
    const statsData = [
      { icon: "🏛️", val: `${civicScore} pts`, sub: "Civic Score" },
      { icon: "🔥", val: `${streakCount} days`, sub: "Streak" },
      { icon: "📚", val: `${modulesCompleted}`, sub: "Modules" },
    ];
    statsData.forEach((s, i) => {
      const x = 80 + i * 300;
      const y = 520;
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.roundRect(x, y, 260, 160, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, 260, 160, 20);
      ctx.stroke();
      ctx.font = "40px sans-serif";
      ctx.fillText(s.icon, x + 20, y + 52);
      ctx.fillStyle = "#fff";
      ctx.font = "700 36px sans-serif";
      ctx.fillText(s.val, x + 20, y + 108);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "400 22px sans-serif";
      ctx.fillText(s.sub, x + 20, y + 142);
    });

    // bottom CTA
    ctx.fillStyle = "rgba(245,166,35,0.12)";
    ctx.beginPath();
    ctx.roundRect(80, 760, 920, 100, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(80, 760, 920, 100, 16);
    ctx.stroke();
    ctx.fillStyle = "#f5a623";
    ctx.font = "700 28px sans-serif";
    ctx.fillText("Where do you stand? civiq.ca", 540, 820);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "400 22px sans-serif";
    const textW = ctx.measureText("Where do you stand? civiq.ca").width;
    ctx.fillText("Where do you stand? civiq.ca", 540 - textW / 2 + 0, 820);

    // actually center it
    ctx.clearRect(80, 760, 920, 100);
    ctx.fillStyle = "rgba(245,166,35,0.12)";
    ctx.beginPath(); ctx.roundRect(80, 760, 920, 100, 16); ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(80, 760, 920, 100, 16); ctx.stroke();
    ctx.fillStyle = "#f5a623";
    ctx.font = "700 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Where do you stand?  ·  civiq.ca", 540, 820);

    // watermark
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = "500 20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Ontario Civic Platform · Powered by Civic Clarity Foundation", 1000, 990);

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) { setSharing(false); return; }

    const file = new File([blob], "civiq-compass.png", { type: "image/png" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `I'm ${label} on Civiq`,
          text: `I just found out where I stand politically on Ontario issues. Find out where you stand →`,
          files: [file],
        });
      } catch (_) {}
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "civiq-compass.png";
      a.click();
      URL.revokeObjectURL(url);
    }
    setSharing(false);
  };

  const [leaderboard, setLeaderboard] = useState<{ userId: string; username: string; streakCount: number; civicScore: number; isCurrentUser: boolean }[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/streak", { method: "POST" });
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => {
        if (d.leaderboard) setLeaderboard(d.leaderboard);
        if (d.currentUserRank) setCurrentUserRank(d.currentUserRank);
      })
      .catch(() => {});
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
            <div style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
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
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={generateShareCard}
                  disabled={sharing}
                  style={{
                    background: sharing ? "rgba(245,166,35,0.08)" : "rgba(245,166,35,0.12)",
                    border: "1px solid rgba(245,166,35,0.25)",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#f5a623",
                    cursor: sharing ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                >
                  {sharing ? "Generating..." : "Share result ↗"}
                </button>
                <Link href="/onboarding" style={{ fontSize: "12px", color: "#444", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: "8px" }}>Retake quiz</Link>
              </div>
            </div>
          )}
        </motion.div>
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>Ontario Leaderboard</div>
            {currentUserRank && (
              <div style={{ fontSize: "12px", color: "#f5a623", fontWeight: "700" }}>You're #{currentUserRank}</div>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#555", textAlign: "center", padding: "20px 0" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {leaderboard.slice(0, 10).map((u, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const rank = i + 1;
                return (
                  <motion.div
                    key={u.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 14px", borderRadius: "12px",
                      backgroundColor: u.isCurrentUser ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
                      border: u.isCurrentUser ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontSize: rank <= 3 ? "18px" : "13px", fontWeight: "700", color: "#555", width: "24px", textAlign: "center", flexShrink: 0 }}>
                      {rank <= 3 ? medals[rank - 1] : `${rank}`}
                    </div>
                    <div style={{ flex: 1, fontSize: "14px", fontWeight: u.isCurrentUser ? "700" : "500", color: u.isCurrentUser ? "#f5a623" : "#ccc" }}>
                      {u.isCurrentUser ? "You" : u.username}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {u.streakCount > 0 && (
                        <div style={{ fontSize: "12px", color: "#f5a623", fontWeight: "600" }}>🔥 {u.streakCount}</div>
                      )}
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#888" }}>{u.civicScore} pts</div>
                    </div>
                  </motion.div>
                );
              })}
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
              <div style={{ fontSize: "13px", color: "#555" }}>When you read a feed card and log your take, it shows up here.</div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "7px", top: 0, bottom: 0, width: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
              {opinions.map((op, i) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
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
          {/* My Ontario */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px 28px", marginTop: "20px" }}
        >
          <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>My Ontario</div>
          <div style={{ fontSize: "13px", color: "#333", marginBottom: "20px" }}>Your political footprint since joining Civiq.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Compass identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "22px" }}>🧭</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: skipped ? "#555" : color }}>
                  {skipped ? "No compass yet" : label}
                </div>
                <div style={{ fontSize: "12px", color: "#444" }}>Political identity based on your quiz</div>
              </div>
            </div>

            {/* Engagement summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { icon: "📚", label: "Modules completed", value: modulesCompleted, color: "#4ade80" },
                { icon: "🗳️", label: "Polls voted", value: pollsVoted, color: "#60a5fa" },
                { icon: "💬", label: "Opinions logged", value: opinions.length, color: "#a78bfa" },
                { icon: "🔥", label: "Day streak", value: streakCount, color: "#f5a623" },
              ].map(item => (
                <div key={item.label} style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: `${item.color}08`, border: `1px solid ${item.color}15` }}>
                  <div style={{ fontSize: "18px", marginBottom: "4px" }}>{item.icon}</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: item.color, letterSpacing: "-0.5px" }}>{item.value}</div>
                  <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", marginTop: "2px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Narrative line */}
            <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", fontSize: "13px", color: "#888", lineHeight: "1.7" }}>
              {modulesCompleted === 0 && pollsVoted === 0
                ? "You're just getting started. Complete a module or vote on a poll to build your Ontario political story."
                : `You've engaged with ${modulesCompleted + pollsVoted + opinions.length} pieces of Ontario civic content${streakCount > 1 ? ` and kept a ${streakCount}-day streak` : ""}. ${skipped ? "Take the quiz to complete your political profile." : `Your ${label} compass shapes how you see issues.`}`
              }
            </div>

          </div>
        </motion.div>
        </motion.div>

      {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,0,0,0.08)", borderRadius: "16px", padding: "24px 28px", marginTop: "20px" }}
        >
          <div style={{ fontSize: "11px", color: "#444", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Danger Zone</div>
          <div style={{ fontSize: "13px", color: "#333", marginBottom: "16px" }}>Permanently delete your account and all associated data. This cannot be undone.</div>
          <button
            onClick={async () => {
              if (!confirm("Are you sure? This will permanently delete your account and all your data. This cannot be undone.")) return;
              const res = await fetch("/api/user/delete", { method: "DELETE" });
              if (res.ok) {
                window.location.href = "/";
              } else {
                alert("Something went wrong. Email rehan.mazid@gmail.com to request deletion.");
              }
            }}
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#f87171",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Delete my account
          </button>
        </motion.div>

      </div>
    </AppLayout>
  );
}
