"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const ISSUES = [
  { id: "housing-zoning", label: "Municipal zoning bypass" },
  { id: "education-cuts", label: "Education funding cuts" },
  { id: "healthcare-privatization", label: "Private healthcare clinics" },
  { id: "greenbelt", label: "Greenbelt development" },
  { id: "carbon-tax", label: "Federal carbon tax" },
  { id: "minimum-wage", label: "Minimum wage increase" },
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
  if (max === left) return `rgba(96,165,250,${opacity})`;
  if (max === right) return `rgba(248,113,113,${opacity})`;
  return `rgba(167,139,250,${opacity})`;
}

export default function MapClient() {
  const [issueId, setIssueId] = useState(ISSUES[0].id);
  const [byRegion, setByRegion] = useState<Record<string, RegionData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [userStance, setUserStance] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // Data fetch on mount, intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/region-votes?issueId=${issueId}`)
      .then(r => r.json())
      .then(d => {
        setByRegion(d.byRegion || {});
        if (d.userVote) {
          setVoted(v => ({ ...v, [issueId]: true }));
          setUserRegion(d.userVote.regionId);
          setUserStance(d.userVote.stance);
          setSelectedRegion(d.userVote.regionId);
        }
        setLoading(false);
      });
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

  const handleBubbleTap = (regionId: string) => {
    if (selectedRegion === regionId) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(regionId);
    }
    setUserRegion(regionId);
  };

  const totalVotes = Object.values(byRegion).reduce((acc, r) => acc + r.total, 0);
  const hasVoted = voted[issueId];
  const selectedData = selectedRegion ? byRegion[selectedRegion] : undefined;
  const selectedRegionObj = selectedRegion ? REGIONS.find(r => r.id === selectedRegion) : null;

  const totalLeft = Object.values(byRegion).reduce((acc, r) => acc + r.left, 0);
  const totalRight = Object.values(byRegion).reduce((acc, r) => acc + r.right, 0);
  const totalCentre = Object.values(byRegion).reduce((acc, r) => acc + r.centre, 0);

  return (
    <AppLayout active="/map">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .region-bubble { transition: all 0.2s ease; cursor: pointer; }
        .issue-scroll::-webkit-scrollbar { display: none; }
        .issue-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{
        padding: isMobile ? "20px 16px 100px" : "32px 40px",
        maxWidth: "980px", width: "100%",
        margin: "0 auto",
        fontFamily: "'DM Sans', sans-serif",
        color: "#fff",
      }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
            Live Opinion Map
          </div>
          <div style={{ fontSize: isMobile ? "22px" : "26px", fontWeight: "800", letterSpacing: "-0.8px", marginBottom: "4px" }}>
            Where Does Ontario Stand?
          </div>
          <div style={{ fontSize: "13px", color: "#444" }}>
            {totalVotes.toLocaleString()} votes · live
          </div>
        </motion.div>

        {/* Issue selector — horizontal scroll on mobile */}
        <div
          className="issue-scroll"
          style={{
            display: "flex", gap: "8px",
            overflowX: isMobile ? "auto" : "hidden",
            flexWrap: isMobile ? "nowrap" : "wrap",
            marginBottom: "20px",
            paddingBottom: isMobile ? "4px" : "0",
          }}
        >
          {ISSUES.map(issue => (
            <button
              key={issue.id}
              onClick={() => { setIssueId(issue.id); setSelectedRegion(null); }}
              style={{
                padding: "8px 14px", borderRadius: "100px",
                fontSize: "12px", fontWeight: "600",
                border: issueId === issue.id ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: issueId === issue.id ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.02)",
                color: issueId === issue.id ? "#f5a623" : "#555",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {issue.label}
            </button>
          ))}
        </div>

        {/* Layout — grid on desktop, stack on mobile */}
        <div style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: isMobile ? "column" : undefined,
          gridTemplateColumns: isMobile ? undefined : "1fr 300px",
          gap: "16px",
          alignItems: "start",
        }}>

          {/* SVG Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: isMobile ? "12px" : "16px",
              position: "relative",
            }}
          >
            {isMobile && (
              <div style={{ fontSize: "11px", color: "#444", textAlign: "center", marginBottom: "8px", fontWeight: "600" }}>
                Tap a region to select it
              </div>
            )}
            <svg viewBox="0 0 700 520" style={{ width: "100%", height: "auto" }}>
              <path
                d="M100,100 L160,60 L240,50 L320,40 L420,45 L520,60 L600,90 L640,140 L620,200 L580,240 L560,300 L520,350 L480,380 L440,360 L400,380 L360,400 L320,420 L280,440 L240,460 L200,450 L160,420 L130,390 L110,350 L90,300 L80,240 L90,180 Z"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <ellipse cx="220" cy="490" rx="80" ry="20" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />
              <ellipse cx="420" cy="480" rx="120" ry="25" fill="rgba(96,165,250,0.05)" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />

              {REGIONS.map(region => {
                const data = byRegion[region.id];
                const isSelected = selectedRegion === region.id || userRegion === region.id;
                const color = getDominantColor(data, loading ? 0.3 : 0.75);
                const strokeColor = isSelected ? "#f5a623" : "rgba(255,255,255,0.1)";
                const radius = isSelected ? region.r + 3 : region.r;

                return (
                  <g key={region.id}>
                    {isSelected && (
                      <circle
                        cx={region.x} cy={region.y}
                        r={radius + 6}
                        fill="none"
                        stroke="rgba(245,166,35,0.25)"
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      cx={region.x} cy={region.y} r={radius}
                      fill={color}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : 1}
                      className="region-bubble"
                      onClick={() => handleBubbleTap(region.id)}
                    />
                    {data && data.total > 0 && !loading && (
                      <text
                        x={region.x} y={region.y + 4}
                        textAnchor="middle"
                        fontSize="10" fontWeight="700"
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
            <div style={{
              display: "flex", gap: isMobile ? "10px" : "16px",
              flexWrap: "wrap",
              padding: "10px 8px 0",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              marginTop: "8px",
            }}>
              {[
                { color: "#60a5fa", label: "Left" },
                { color: "#a78bfa", label: "Centre" },
                { color: "#f87171", label: "Right" },
                { color: "rgba(40,40,50,1)", label: "No data", border: "1px solid rgba(255,255,255,0.1)" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: l.color, border: l.border, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#444", fontWeight: "600" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sidebar panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Selected region info — shows on tap */}
            <AnimatePresence mode="wait">
              {selectedRegionObj && (
                <motion.div
                  key={selectedRegionObj.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px", padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700" }}>{selectedRegionObj.label}</div>
                    <button
                      onClick={() => setSelectedRegion(null)}
                      style={{ background: "none", border: "none", color: "#444", fontSize: "16px", cursor: "pointer", padding: "0 0 0 8px" }}
                    >×</button>
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", marginBottom: "10px" }}>
                    {selectedData ? `${selectedData.total} vote${selectedData.total !== 1 ? "s" : ""}` : "No votes yet"}
                  </div>
                  {selectedData && selectedData.total > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { key: "left", label: "Left", color: "#60a5fa" },
                        { key: "centre", label: "Centre", color: "#a78bfa" },
                        { key: "right", label: "Right", color: "#f87171" },
                      ].map(s => {
                        const val = selectedData[s.key as keyof RegionData] as number;
                        const pct = Math.round((val / selectedData.total) * 100);
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
                borderRadius: "16px", padding: "18px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
                Add your voice
              </div>

              {!hasVoted ? (
                <>
                  {/* Region selector — dropdown on mobile */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>Your region:</div>
                    <select
                      value={userRegion || ""}
                      onChange={e => { setUserRegion(e.target.value); setSelectedRegion(e.target.value); }}
                      style={{
                        width: "100%", padding: "11px 14px",
                        borderRadius: "10px",
                        border: userRegion ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "#0d0d18",
                        color: userRegion ? "#f5a623" : "#555",
                        fontSize: "13px", fontWeight: "600",
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        paddingRight: "32px",
                      }}
                    >
                      <option value="" disabled style={{ color: "#555" }}>Select your region…</option>
                      {REGIONS.map(r => (
                        <option key={r.id} value={r.id} style={{ backgroundColor: "#0d0d18", color: "#fff" }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {!isMobile && (
                      <div style={{ fontSize: "11px", color: "#333", marginTop: "6px" }}>
                        Or tap a bubble on the map
                      </div>
                    )}
                  </div>

                  {userRegion && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>Your stance:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "14px" }}>
                        {[
                          { id: "left", label: "Left leaning", color: "#60a5fa" },
                          { id: "centre", label: "Centrist", color: "#a78bfa" },
                          { id: "right", label: "Right leaning", color: "#f87171" },
                        ].map(s => (
                          <button
                            key={s.id}
                            onClick={() => setUserStance(s.id)}
                            style={{
                              padding: "11px 14px", borderRadius: "10px",
                              border: userStance === s.id ? `1px solid ${s.color}` : "1px solid rgba(255,255,255,0.06)",
                              backgroundColor: userStance === s.id ? `${s.color}12` : "rgba(255,255,255,0.02)",
                              color: userStance === s.id ? s.color : "#555",
                              fontSize: "13px", fontWeight: "600",
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                              textAlign: "left", transition: "all 0.15s ease",
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
                        {submitting ? "Submitting..." : "Add my vote →"}
                      </button>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: "16px", borderRadius: "10px",
                    backgroundColor: "rgba(74,222,128,0.07)",
                    border: "1px solid rgba(74,222,128,0.15)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>✓</div>
                  <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: "600" }}>Your vote is on the map</div>
                  <div style={{ fontSize: "12px", color: "#444", marginTop: "4px" }}>Switch issues above to vote on more</div>
                </motion.div>
              )}
            </motion.div>

            {/* Province-wide stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px", padding: "18px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#444", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
                Province-wide
              </div>
              {totalVotes === 0 ? (
                <div style={{ fontSize: "13px", color: "#333" }}>No votes yet on this issue.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { key: "left", label: "Left", val: totalLeft, color: "#60a5fa" },
                    { key: "centre", label: "Centre", val: totalCentre, color: "#a78bfa" },
                    { key: "right", label: "Right", val: totalRight, color: "#f87171" },
                  ].map(s => {
                    const pct = Math.round((s.val / totalVotes) * 100);
                    return (
                      <div key={s.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: s.color, fontWeight: "600" }}>{s.label}</span>
                          <span style={{ fontSize: "12px", color: "#444" }}>{pct}% · {s.val.toLocaleString()}</span>
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
                  <div style={{ fontSize: "11px", color: "#2a2a2a", marginTop: "2px" }}>{totalVotes.toLocaleString()} total votes</div>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
