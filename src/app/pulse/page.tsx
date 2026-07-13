"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Flame, Eye, Lightbulb } from "lucide-react";

const HEAT_COLORS: Record<string, string> = {
  rising: "#f59e0b",
  cooling: "#60a5fa",
  exploding: "#f87171",
};

const HEAT_LABELS: Record<string, string> = {
  rising: "↑ Rising",
  cooling: "↓ Cooling",
  exploding: "Exploding",
};

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: "#60a5fa",
  Economy: "#4ade80",
  Education: "#f59e0b",
  Housing: "#a78bfa",
  Healthcare: "#f87171",
  Environment: "#34d399",
  default: "#f5a623",
};

type PulseItem = {
  title: string;
  summary: string;
  category: string;
  heat: "rising" | "cooling" | "exploding";
};

type Pulse = {
  week: string;
  headline: string;
  items: PulseItem[];
  watchThis: string;
  didYouKnow: string;
};

export default function PulsePage() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pulse")
      .then(r => r.json())
      .then(data => { setPulse(data.pulse); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppLayout active="/pulse">
      <style>{`@keyframes breathe { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }`}</style>
      <div style={{ padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 48px)", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>    

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#f5a623", animation: "breathe 2s infinite" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#f5a623", letterSpacing: "0.1em", textTransform: "uppercase" }}>Weekly Pulse</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Ontario This Week</div>
          {pulse && <div style={{ fontSize: "14px", color: "#444" }}>{pulse.week}</div>}
        </motion.div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: "120px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "16px" }} />
            ))}
          </div>
        )}

        <AnimatePresence>
          {pulse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  backgroundColor: "rgba(245,166,35,0.06)",
                  border: "1px solid rgba(245,166,35,0.15)",
                  borderRadius: "16px", padding: "20px 24px",
                  marginBottom: "24px", fontSize: "17px",
                  fontWeight: "600", lineHeight: "1.5",
                }}
              >
                {pulse.headline}
              </motion.div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {pulse.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px", padding: "20px 24px",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "700",
                        color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
                        backgroundColor: `${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default}15`,
                        padding: "3px 10px", borderRadius: "100px",
                        letterSpacing: "0.05em", textTransform: "uppercase",
                      }}>{item.category}</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: HEAT_COLORS[item.heat] || "#f5a623", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {item.heat === "exploding" && <Flame size={12} />}
                        {HEAT_LABELS[item.heat]}
                      </span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.2px" }}>{item.title}</div>
                    <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.7" }}>{item.summary}</div>
                  </motion.div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Watch This", content: pulse.watchThis, color: "#60a5fa", icon: Eye },
                  { label: "Did You Know", content: pulse.didYouKnow, color: "#a78bfa", icon: Lightbulb },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                    style={{
                      backgroundColor: `${item.color}06`,
                      border: `1px solid ${item.color}20`,
                      borderRadius: "16px", padding: "20px 24px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "700", color: item.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <item.icon size={13} />
                      {item.label}
                    </div>
                    <div style={{ fontSize: "14px", color: "#777", lineHeight: "1.7" }}>{item.content}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
