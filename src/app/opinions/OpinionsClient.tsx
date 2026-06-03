"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: "#60a5fa",
  Economy: "#4ade80",
  Education: "#f59e0b",
  Housing: "#a78bfa",
  Healthcare: "#f87171",
  Environment: "#34d399",
  default: "#f5a623",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type Opinion = {
  id: string;
  opinion: string;
  createdAt: string;
  cardId: string;
  cardTitle: string | null;
  cardCategory: string | null;
  cardSummary: string | null;
};

export default function OpinionsClient({ opinions }: { opinions: Opinion[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AppLayout active="/opinions">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      <div style={{
        padding: "40px 24px 80px",
        maxWidth: "820px",
        width: "100%",
        margin: "0 auto",
        fontFamily: "'DM Sans', sans-serif",
        color: "#fff",
      }}>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "36px" }}
        >
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>
            Your Opinions
          </div>
          <div style={{ fontSize: "14px", color: "#444" }}>
            {opinions.length === 0
              ? "You haven't logged any opinions yet"
              : `${opinions.length} opinion${opinions.length === 1 ? "" : "s"} logged — your political thinking over time`}
          </div>
        </motion.div>

        {opinions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗒️</div>
            <div style={{ fontSize: "16px", color: "#555", marginBottom: "8px" }}>Nothing here yet</div>
            <div style={{ fontSize: "13px", color: "#333", marginBottom: "28px" }}>
              Open any issue from the feed and log what you think about it.
            </div>
            <Link
              href="/dashboard"
              style={{
                backgroundColor: "#f5a623", color: "#000",
                padding: "11px 24px", borderRadius: "10px",
                fontWeight: "700", fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Go to feed
            </Link>
          </motion.div>
        )}

        {/* Timeline */}
        {opinions.length > 0 && (
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: "19px",
              top: "8px",
              bottom: "8px",
              width: "1px",
              backgroundColor: "rgba(255,255,255,0.05)",
            }} />

            <AnimatePresence>
              {opinions.map((op, i) => {
                const color = CATEGORY_COLORS[op.cardCategory || ""] || CATEGORY_COLORS.default;
                const isExpanded = expanded === op.id;

                return (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex",
                      gap: "20px",
                      marginBottom: "16px",
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      marginTop: "22px",
                      flexShrink: 0,
                      boxShadow: `0 0 8px ${color}60`,
                      zIndex: 1,
                    }} />

                    {/* Card */}
                    <motion.div
                      whileHover={{ y: -1 }}
                      onClick={() => setExpanded(isExpanded ? null : op.id)}
                      style={{
                        flex: 1,
                        backgroundColor: isExpanded
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isExpanded ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                        borderRadius: "16px",
                        padding: "20px 22px",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                      }}
                    >
                      {/* Top row */}
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: isExpanded ? "14px" : "0",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px",
                            flexWrap: "wrap",
                          }}>
                            {op.cardCategory && (
                              <span style={{
                                fontSize: "10px", fontWeight: "700",
                                color,
                                backgroundColor: `${color}15`,
                                padding: "2px 8px",
                                borderRadius: "100px",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}>
                                {op.cardCategory}
                              </span>
                            )}
                            <span style={{ fontSize: "11px", color: "#333" }}>
                              {timeAgo(op.createdAt)}
                            </span>
                          </div>
                          <div style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            letterSpacing: "-0.2px",
                            lineHeight: "1.4",
                            color: "#ddd",
                          }}>
                            {op.cardTitle || "Untitled issue"}
                          </div>
                        </div>
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          style={{ fontSize: "12px", color: "#333", flexShrink: 0, marginTop: "2px" }}
                        >
                          ▼
                        </motion.span>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            {op.cardSummary && (
                              <div style={{
                                fontSize: "13px",
                                color: "#444",
                                lineHeight: "1.6",
                                marginBottom: "16px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid rgba(255,255,255,0.04)",
                              }}>
                                {op.cardSummary}
                              </div>
                            )}

                            <div style={{ marginBottom: "16px" }}>
                              <div style={{
                                fontSize: "10px",
                                color: "#333",
                                fontWeight: "700",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginBottom: "8px",
                              }}>
                                What you thought
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#999",
                                lineHeight: "1.7",
                                fontStyle: "italic",
                                borderLeft: `2px solid ${color}`,
                                paddingLeft: "12px",
                              }}>
                                "{op.opinion}"
                              </div>
                            </div>

                            {op.cardId && (
                              <Link
                                href={`/issues/${op.cardId}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: color,
                                  textDecoration: "none",
                                }}
                              >
                                View full issue →
                              </Link>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </AppLayout>
  );
}