"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const ISSUES = [
  { id: "housing-zoning", label: "Municipal zoning bypass for housing" },
  { id: "education-cuts", label: "Ontario education funding cuts" },
  { id: "healthcare-privatization", label: "Private healthcare clinics in Ontario" },
  { id: "greenbelt", label: "Greenbelt development" },
  { id: "carbon-tax", label: "Federal carbon tax" },
  { id: "minimum-wage", label: "Ontario minimum wage increase" },
];

const REGIONS = [
  { id: "gta", label: "Greater Toronto Area", x: 370, y: 310, r: 36 },
  { id: "peel", label: "Peel Region", x: 320, y: 335, r: 22 },
  { id: "york", label: "York Region", x: 370, y: 270, r: 22 },
  { id: "durham", label: "Durham Region", x: 430, y: 295, r: 20 },
  { id: "hamilton", label: "Hamilton", x: 310, y: 370, r: 18 },
  { id: "waterloo", label: "Waterloo Region", x: 260, y: 350, r: 18 },
  { id: "ottawa", label: "Ottawa", x: 560, y: 250, r: 24 },
  { id: "london", label: "London", x: 230, y: 390, r: 18 },
  { id: "kingston", label: "Kingston", x: 490, y: 280, r: 16 },
  { id: "sudbury", label: "Sudbury", x: 310, y: 195, r: 16 },
  { id: "windsor", label: "Windsor", x: 180, y: 430, r: 16 },
  { id: "thunderbay", label: "Thunder Bay", x: 170, y: 150, r: 16 },
  { id: "barrie", label: "Barrie", x: 340, y: 245, r: 16 },
  { id: "cambridge", label: "Cambridge / K-W", x: 258, y: 365, r: 14 },
];

type RegionData = {
  left: number;
  right: number;
  centre: number;
  total: number;
};

function getDominantColor(data: RegionData | undefined, opacity = 1) {
  if (!data || data.total === 0) return `rgba(40,40,50,${opacity})`;
  const { left, right, centre } = data;
  const max = Math.max(left, right, centre);
  if (max === left) return `rgba(96,165,250,${opacity})`;   // blue
  if (max === right) return `rgba(248,113,113,${opacity})`; // red
  return `rgba(167,139,250,${opacity})`;                     // purple
}

function getStanceLabel(data: RegionData | undefined) {
  if (!data || data.total === 0) return "No votes yet";
  const { left, right, centre, total } = data;
  const pct = (n: number) => Math.round((n / total) * 100);
  if (left >= right && left >= centre) return `${pct(left)}% lean left`;
  if (right >= left && right >= centre) return `${pct(right)}% lean right`;
  return `${pct(centre)}% centrist`;
}

export default function MapClient() {
  const [issueId, setIssueId] = useState(ISSUES[0].id);
  const [byRegion, setByRegion] = useState<Record<string, RegionData>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [userStance, setUserStance] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/region-votes?issueId=${issueId}`)
      .then(r => r.json())
      .then(d => { setByRegion(d.byRegion || {}); setLoading(false); });
  }, [issueId]);

  const handleVote = async () => {
    if (!userRegion || !userStance || submitting) return;
    setSubmitting(true);
    await fetch("/api/region-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, regionId: userRegion, stance: userStance }),
    });
    setVoted(v => ({ ...v, [issueId]: true }));
    const updated = await fetch(`/api/region-votes?issueId=${issueId}`).then(r => r.json());
    setByRegion(updated.byRegion || {});
    setSubmitting(false);
  };

  const totalVotes = Object.values(byRegion).reduce((acc, r) => acc + r.total, 0);
  const hovered = hoveredRegion ? REGIONS.find(r => r.id === hoveredRegion) : null;
  const hoveredData = hoveredRegion ? byRegion[hoveredRegion] : undefined;
  const hasVoted = voted[issueId];

  return (
    <AppLayout active="/map">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .region-bubble { transition: all 0.25s ease; cursor: pointer; }
        .region-bubble:hover { filter: brightness(1.3); }
        .stance-btn { transition: all 0.2s ease; }
        .stance-btn:hover { transform: translateY(-1px); }
      `}</style>

      <div style={{ padding: "32px 40px", maxWidth: "980px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Live Opinion Map
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.8px", marginBottom: "6px" }}>
            Where Does Ontario Stand?
          </div>
          <div style={{ fontSize: "14px", color: "#444" }}>
            {totalVotes.toLocaleString()} Civiq users have voted · updates in real time
          </div>
        </motion.div>

        {/* Issue selector */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
          {ISSUES.map(issue => (
            <button
              key={issue.id}
              onClick={() => setIssueId(issue.id)}
              style={{
                padding: "8px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600",
                border: issueId === issue.id ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: issueId === issue.id ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.02)",
                color: issueId === issue.id ? "#f5a623" : "#555",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              {issue.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>

          {/* SVG Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "16px",
              position: "relative",
            }}
          >
            <svg viewBox="0 0 700 520" style={{ width: "100%", height: "auto" }}>
              {/* Ontario silhouette — simplified polygon */}
              <path
                d="M100,100 L160,60 L240,50 L320,40 L420,45 L520,60 L600,90 L640,140 L620,200 L580,240 L560,300 L520,350 L480,380 L440,360 L400,380 L360,400 L320,420 L280,440 L240,460 L200,450 L160,420 L130,390 L110,350 L90,300 L80,240 L90,180 Z"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              {/* Great Lakes hints */}
              <ellipse cx="220" cy="490" rx="80" ry="20" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />
              <ellipse cx="420" cy="480" rx="120" ry="25" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />

              {/* Region bubbles */}
              {REGIONS.map(region => {
                const data = byRegion[region.id];
                const isHovered = hoveredRegion === region.id;
                const isSelected = userRegion === region.id;
                const color = getDominantColor(data, loading ? 0.3 : 0.75);
                const strokeColor = isSelected ? "#f5a623" : isHovered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)";

                return (
                  <g key={region.id}>
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={isHovered ? region.r + 3 : region.r}
                      fill={color}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : 1}
                      className="region-bubble"
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => setUserRegion(region.id)}
                    />
                    {data && data.total > 0 && !loading && (
                      <text
                        x={region.x}
                        y={region.y + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="rgba(255,255,255,0.9)"
                        style={{ pointerEvents: "none", fontFamily: "DM Sans, sans-serif" }}
                      >
                        {data.total}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", padding: "12px 8px 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "8px" }}>
              {[
                { color: "#60a5fa", label: "Lean left" },
                { color: "#a78bfa", label: "Centrist" },
                { color: "#f87171", label: "Lean right" },
                { color: "rgba(40,40,50,1)", label: "No data", border: "1px solid rgba(255,255,255,0.1)" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: l.color, border: l.border, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#444", fontWeight: "600" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Tooltip / hovered region info */}
            <AnimatePresence mode="wait">
              {hovered && (
                <motion.div
                  key={hovered.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px", padding: "18px",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>{hovered.label}</div>
                  <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
                    {hoveredData ? `${hoveredData.total} vote${hoveredData.total !== 1 ? "s" : ""}` : "No votes yet"}
                  </div>
                  {hoveredData && hoveredData.total > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { key: "left", label: "Left", color: "#60a5fa" },
                        { key: "centre", label: "Centre", color: "#a78bfa" },
                        { key: "right", label: "Right", color: "#f87171" },
                      ].map(s => {
                        const val = hoveredData[s.key as keyof RegionData] as number;
                        const pct = Math.round((val / hoveredData.total) * 100);
                        return (
                          <div key={s.key}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={{ fontSize: "11px", color: s.color, fontWeight: "600" }}>{s.label}</span>
                              <span style={{ fontSize: "11px", color: "#444" }}>{pct}%</span>
                            </div>
                            <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ height: "100%", backgroundColor: s.color, borderRadius: "10px" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vote panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px", padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
                Add your voice
              </div>

              <div style={{ fontSize: "13px", color: "#555", marginBottom: "14px" }}>
                {userRegion
                  ? `📍 ${REGIONS.find(r => r.id === userRegion)?.label}`
                  : "Click a region on the map to select yours"}
              </div>

              {userRegion && !hasVoted && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ fontSize: "13px", color: "#555", marginBottom: "10px" }}>Your stance on this issue:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {[
                      { id: "left", label: "Left leaning", color: "#60a5fa" },
                      { id: "centre", label: "Centrist", color: "#a78bfa" },
                      { id: "right", label: "Right leaning", color: "#f87171" },
                    ].map(s => (
                      <button
                        key={s.id}
                        className="stance-btn"
                        onClick={() => setUserStance(s.id)}
                        style={{
                          padding: "12px 16px", borderRadius: "10px",
                          border: userStance === s.id ? `1px solid ${s.color}` : "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: userStance === s.id ? `${s.color}12` : "rgba(255,255,255,0.02)",
                          color: userStance === s.id ? s.color : "#555",
                          fontSize: "13px", fontWeight: "600",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          textAlign: "left",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleVote}
                    disabled={!userStance || submitting}
                    style={{
                      width: "100%", padding: "13px", borderRadius: "10px",
                      border: "none",
                      backgroundColor: userStance ? "#f5a623" : "rgba(255,255,255,0.04)",
                      color: userStance ? "#000" : "#333",
                      fontSize: "14px", fontWeight: "700",
                      cursor: userStance ? "pointer" : "not-allowed",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {submitting ? "Submitting..." : "Add my vote to the map"}
                  </button>
                </motion.div>
              )}

              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: "14px", borderRadius: "10px",
                    backgroundColor: "rgba(74,222,128,0.07)",
                    border: "1px solid rgba(74,222,128,0.15)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "6px" }}>✓</div>
                  <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: "600" }}>Your vote is on the map</div>
                  <div style={{ fontSize: "12px", color: "#444", marginTop: "4px" }}>Switch issues above to vote on more</div>
                </motion.div>
              )}
            </motion.div>

            {/* Overall stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px", padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
                Province-wide
              </div>
              {(() => {
                const total = Object.values(byRegion).reduce((acc, r) => acc + r.total, 0);
                const left = Object.values(byRegion).reduce((acc, r) => acc + r.left, 0);
                const right = Object.values(byRegion).reduce((acc, r) => acc + r.right, 0);
                const centre = Object.values(byRegion).reduce((acc, r) => acc + r.centre, 0);
                if (total === 0) return <div style={{ fontSize: "13px", color: "#333" }}>No votes yet on this issue.</div>;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { key: "left", label: "Left", val: left, color: "#60a5fa" },
                      { key: "centre", label: "Centre", val: centre, color: "#a78bfa" },
                      { key: "right", label: "Right", val: right, color: "#f87171" },
                    ].map(s => {
                      const pct = Math.round((s.val / total) * 100);
                      return (
                        <div key={s.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", color: s.color, fontWeight: "600" }}>{s.label}</span>
                            <span style={{ fontSize: "12px", color: "#444" }}>{pct}% · {s.val.toLocaleString()} votes</span>
                          </div>
                          <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                            <motion.div
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              style={{ height: "100%", backgroundColor: s.color, borderRadius: "10px" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: "11px", color: "#2a2a2a", marginTop: "4px" }}>{total.toLocaleString()} total votes</div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}