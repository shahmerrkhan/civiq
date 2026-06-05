"use client";
import { useEffect, useState } from "react";
import { recordActivity, getStreakData } from "@/lib/streak";

export default function StreakBadge() {
  const [streak, setStreak] = useState(0);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const previous = getStreakData().streak;
    const current = recordActivity();
    setStreak(current);
    if (current > previous && current > 1) {
      setPopped(true);
      setTimeout(() => setPopped(false), 2000);
    }
  }, []);

  if (streak === 0) return null;

  return (
    <div
      title={`${streak}-day streak`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "100px",
        backgroundColor: streak >= 7 ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${streak >= 7 ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`,
        fontSize: "13px",
        fontWeight: "700",
        color: streak >= 7 ? "#f5a623" : "#888",
        transition: "all 0.3s ease",
        transform: popped ? "scale(1.12)" : "scale(1)",
        cursor: "default",
        userSelect: "none",
      }}
    >
      🔥 {streak} day{streak !== 1 ? "s" : ""}
    </div>
  );
}
