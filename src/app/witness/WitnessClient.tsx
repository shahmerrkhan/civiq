"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const ease = [0.16, 1, 0.3, 1] as const;

type WitnessEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  deadlineAt: string;
  status: string;
  outcome: string | null;
  outcomeExplanation: string | null;
  sourceUrl: string | null;
  watchCount: number;
  isWatching: boolean;
  daysLeft: number;
  hoursLeft: number;
  isUrgent: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  Bills: "#60a5fa",
  Courts: "#fb923c",
  Elections: "#f87171",
  Budget: "#4ade80",
  Policy: "#a78bfa",
  Municipal: "#34d399",
};

const OUTCOME_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  passed:    { label: "Passed",    color: "#4ade80", emoji: "✅" },
  failed:    { label: "Failed",    color: "#f87171", emoji: "❌" },
  delayed:   { label: "Delayed",   color: "#facc15", emoji: "⏳" },
  cancelled: { label: "Cancelled", color: "#f87171", emoji: "🚫" },
  occurred:  { label: "Occurred",  color: "#60a5fa", emoji: "📌" },
  unknown:   { label: "Unknown",   color: "#555",    emoji: "❓" },
};

function CountdownRing({ daysLeft, hoursLeft, isUrgent }: { daysLeft: number; hoursLeft: number; isUrgent: boolean }) {
  const color = isUrgent ? "#f87171" : daysLeft <= 7 ? "#f5a623" : "#34d399";
  const label = daysLeft === 0 ? `${hoursLeft}h` : `${daysLeft}d`;
  return (
    <div style={{
      width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0,
      border: `2px solid ${color}30`,
      backgroundColor: `${color}10`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {isUrgent && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `2px solid ${color}` }}
        />
      )}
      <div style={{ fontSize: "14px", fontWeight: "800", color, letterSpacing: "-0.5px", lineHeight: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: "9px", color: `${color}80`, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        left
      </div>
    </div>
  );
}

export default function WitnessClient({ userId }: { userId: string | null }) {
  const [upcoming, setUpcoming] = useState<WitnessEvent[]>([]);
  const [resolved, setResolved] = useState<WitnessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "resolved">("upcoming");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/witness")
      .then(r => r.json())
      .then(data => {
        setUpcoming(data.upcoming ?? []);
        setResolved(data.resolved ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleWatch(eventId: string) {
    if (!userId || toggling) return;
    setToggling(eventId);
    const res = await fetch("/api/witness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      const update = (list: WitnessEvent[]) =>
        list.map(e => e.id === eventId
          ? { ...e, isWatching: data.watching, watchCount: e.watchCount + (data.watching ? 1 : -1) }
          : e
        );
      setUpcoming(update);
      setResolved(update);
    }
    setToggling(null);
  }

  if (loading) {
    return (
      <AppLayout active="/witness">
        <div style={{ padding: "32px 20px", maxWidth: "780px", fontFamily: "'DM Sans', sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "32px" }}>
            <div style={{ width: "180px", height: "28px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", marginBottom: "10px" }} />
            <div style={{ width: "300px", height: "16px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px" }} />
          </motion.div>
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease }}
              style={{ height: "88px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      </AppLayout>
    );
  }

  const list = activeTab === "upcoming" ? upcoming : resolved;

  return (
    <AppLayout active="/witness">
      <style>{`
        .witness-card:hover { border-color: rgba(52,211,153,0.2) !important; }
        .watch-btn:hover { opacity: 0.85 !important; }
      `}</style>

      <div style={{ padding: "24px 20px", maxWidth: "780px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          style={{ marginBottom: "32px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
              style={{ fontSize: "28px" }}
            >⏳</motion.span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px", margin: 0 }}>
              Witness
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: "1.6", margin: 0 }}>
            Real Ontario political decisions with a live countdown. Watch any event and get notified the moment it resolves.
          </p>
        </motion.div>

        {/* Urgent banner */}
        {upcoming.some(e => e.isUrgent) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease }}
            style={{
              backgroundColor: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontSize: "16px" }}
            >🔴</motion.span>
            <span style={{ fontSize: "13px", color: "#f87171", fontWeight: "600" }}>
              {upcoming.filter(e => e.isUrgent).length} event{upcoming.filter(e => e.isUrgent).length > 1 ? "s" : ""} happening within 48 hours
            </span>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {([
            { key: "upcoming", label: `Upcoming (${upcoming.length})` },
            { key: "resolved", label: `Resolved (${resolved.length})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #34d399" : "2px solid transparent",
                color: activeTab === tab.key ? "#34d399" : "#444",
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
        </motion.div>

        {/* Event list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease }}
          >
            {list.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}>
                {activeTab === "upcoming" ? "New events generate every Monday." : "No resolved events yet."}
              </div>
            ) : (
              list.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease }}
                  className="witness-card"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: `1px solid ${event.isUrgent ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: "16px",
                    padding: "20px 24px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                  onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>

                    {/* Countdown ring or outcome */}
                    {event.status === "upcoming" ? (
                      <CountdownRing daysLeft={event.daysLeft} hoursLeft={event.hoursLeft} isUrgent={event.isUrgent} />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        style={{
                          width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0,
                          backgroundColor: `${OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555"}15`,
                          border: `2px solid ${OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555"}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "22px",
                        }}
                      >
                        {OUTCOME_CONFIG[event.outcome ?? "unknown"]?.emoji ?? "❓"}
                      </motion.div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: "700",
                          color: CATEGORY_COLORS[event.category] ?? "#f5a623",
                          backgroundColor: `${CATEGORY_COLORS[event.category] ?? "#f5a623"}15`,
                          padding: "3px 10px", borderRadius: "100px",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {event.category}
                        </span>
                        {event.status === "resolved" && (
                          <span style={{
                            fontSize: "11px", fontWeight: "700",
                            color: OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555",
                            backgroundColor: `${OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555"}15`,
                            padding: "3px 10px", borderRadius: "100px",
                          }}>
                            {OUTCOME_CONFIG[event.outcome ?? "unknown"]?.label ?? "Unknown"}
                          </span>
                        )}
                        {event.isWatching && (
                          <span style={{
                            fontSize: "11px", fontWeight: "700",
                            color: "#34d399",
                            backgroundColor: "rgba(52,211,153,0.1)",
                            padding: "3px 10px", borderRadius: "100px",
                          }}>
                            Watching
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "15px", fontWeight: "700",
                        letterSpacing: "-0.2px", lineHeight: "1.35",
                        color: event.status === "resolved" ? "#666" : "#f0ede6",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#333", marginTop: "4px" }}>
                        {event.watchCount} watching
                      </div>
                    </div>

                    {/* Watch button */}
                    {event.status === "upcoming" && userId && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="watch-btn"
                        onClick={e => { e.stopPropagation(); toggleWatch(event.id); }}
                        disabled={toggling === event.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          border: event.isWatching ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: event.isWatching ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.03)",
                          color: event.isWatching ? "#34d399" : "#555",
                          fontSize: "12px", fontWeight: "700",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          flexShrink: 0,
                          marginLeft: "auto",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {toggling === event.id ? "..." : event.isWatching ? "Watching ✓" : "Watch"}
                      </motion.button>
                    )}
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {expanded === event.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{ paddingTop: "16px", marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.7", marginBottom: "12px" }}>
                            {event.description}
                          </p>
                          {event.outcomeExplanation && (
                            <div style={{
                              backgroundColor: `${OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555"}08`,
                              border: `1px solid ${OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555"}20`,
                              borderRadius: "10px",
                              padding: "12px 14px",
                              marginBottom: "12px",
                            }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: OUTCOME_CONFIG[event.outcome ?? "unknown"]?.color ?? "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                What happened
                              </div>
                              <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.6" }}>
                                {event.outcomeExplanation}
                              </div>
                            </div>
                          )}
                          {event.sourceUrl && (
                            <a
                              href={event.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: "12px", color: "#34d399", textDecoration: "none", fontWeight: "600" }}
                            >
                              View source →
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}