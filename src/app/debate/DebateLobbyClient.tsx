"use client";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export type Room = {
  id: string;
  card_title: string;
  card_summary: string;
  status: string;
  expires_at: string | null;
  user_a_id: string;
  user_b_id: string | null;
  user_a_leaning: string;
  user_b_leaning: string | null;
};

function timeLeft(expiresAt: string | null) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

const leaningColor = (l: string | null | undefined) => {
  if (!l) return "#888";
  if (l === "left") return "#a78bfa";
  if (l === "right") return "#60a5fa";
  return "#34d399";
};

const statusBadge = (status: string, expiresAt: string | null) => {
  if (status === "closed") return { label: "Closed", color: "#444", bg: "rgba(255,255,255,0.03)" };
  if (status === "waiting") return { label: "Waiting for match", color: "#f5a623", bg: "rgba(245,166,35,0.06)" };
  const t = timeLeft(expiresAt);
  return { label: t || "Active", color: "#34d399", bg: "rgba(52,211,153,0.06)" };
};

export default function DebateLobbyClient({ userId, rooms }: { userId: string; rooms: Room[] }) {
  const activeRooms = rooms.filter(r => r.status !== "closed");
  const closedRooms = rooms.filter(r => r.status === "closed");

  return (
    <AppLayout active="/debate">
      <style>{`
        .room-card:hover { background-color: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; }
        .room-card { transition: background-color 0.15s ease, border-color 0.15s ease; }
      `}</style>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(16px,4vw,32px) clamp(12px,3vw,20px)", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5a623", marginBottom: "8px" }}>
            Common Ground
          </div>
          <div style={{ fontSize: "clamp(22px,4vw,28px)", fontWeight: "800", letterSpacing: "-0.5px", lineHeight: "1.2", marginBottom: "10px" }}>
            Structured Debates
          </div>
          <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.7", maxWidth: "520px" }}>
            Get matched with someone who sees it differently. Understand their side first — then make your case.
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ marginBottom: "32px", padding: "18px 20px", borderRadius: "14px", backgroundColor: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {[
            { step: "01", label: "Pick an issue", desc: "From your feed, click Discuss This" },
            { step: "02", label: "Steelman first", desc: "Write the strongest version of the opposing view" },
            { step: "03", label: "Make your case", desc: "AI approves your steelman, then you argue yours" },
          ].map((s, i) => (
            <div key={i} style={{ flex: "1 1 140px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#f5a623", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.step}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#ccc", marginBottom: "2px" }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{s.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Active rooms */}
        {activeRooms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "12px" }}>
              Your active debates
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeRooms.map((room, i) => {
                const badge = statusBadge(room.status, room.expires_at);
                const myLeaning = room.user_a_id === userId ? room.user_a_leaning : room.user_b_leaning;
                const theirLeaning = room.user_a_id === userId ? room.user_b_leaning : room.user_a_leaning;
                return (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link href={`/debate/${room.id}`} style={{ textDecoration: "none" }} onClick={() => console.log("room object:", room)}>
                      <div className="room-card" style={{ padding: "16px 18px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6", lineHeight: "1.3", flex: 1 }}>
                            {room.card_title}
                          </div>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: badge.color, backgroundColor: badge.bg, padding: "3px 10px", borderRadius: "100px", border: `1px solid ${badge.color}30`, whiteSpace: "nowrap" }}>
                            {badge.label}
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6", marginBottom: "12px" }}>
                          {room.card_summary?.slice(0, 120)}{room.card_summary?.length > 120 ? "..." : ""}
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: leaningColor(myLeaning), padding: "2px 10px", borderRadius: "100px", border: `1px solid ${leaningColor(myLeaning)}30`, backgroundColor: `${leaningColor(myLeaning)}0d` }}>
                            You · {myLeaning ? myLeaning.charAt(0).toUpperCase() + myLeaning.slice(1) : "?"}
                          </div>
                          {theirLeaning ? (
                            <div style={{ fontSize: "11px", fontWeight: "700", color: leaningColor(theirLeaning), padding: "2px 10px", borderRadius: "100px", border: `1px solid ${leaningColor(theirLeaning)}30`, backgroundColor: `${leaningColor(theirLeaning)}0d` }}>
                              Opponent · {theirLeaning.charAt(0).toUpperCase() + theirLeaning.slice(1)}
                            </div>
                          ) : (
                            <div style={{ fontSize: "11px", color: "#333", padding: "2px 10px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.06)" }}>
                              Waiting for match...
                            </div>
                          )}
                          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#333" }}>Enter →</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* No rooms empty state */}
        {rooms.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ padding: "48px 24px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#f0ede6", marginBottom: "8px" }}>No debates yet</div>
            <div style={{ fontSize: "13px", color: "#444", lineHeight: "1.7", maxWidth: "340px", margin: "0 auto 20px" }}>
              Open any issue card in your feed and tap &quot;Discuss This&quot; to get matched with someone who sees it differently.
            </div>
            <Link href="/dashboard" style={{ display: "inline-block", padding: "10px 24px", borderRadius: "10px", backgroundColor: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#f5a623", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
              Browse the feed →
            </Link>
          </motion.div>
        )}

        {/* Closed rooms */}
        {closedRooms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#333", marginBottom: "12px" }}>
              Past debates
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {closedRooms.map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/debate/${room.id}`} style={{ textDecoration: "none" }} onClick={() => console.log("room object:", room)}>
                    <div className="room-card" style={{ padding: "14px 18px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#555", lineHeight: "1.3", flex: 1 }}>
                        {room.card_title}
                      </div>
                      <div style={{ fontSize: "11px", color: "#333", whiteSpace: "nowrap" }}>View recap →</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

