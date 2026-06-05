"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LABEL_COLORS: Record<string, string> = {
  "Left Libertarian": "#4ade80",
  "Left Leaning": "#60a5fa",
  "Right Libertarian": "#f59e0b",
  "Right Leaning": "#f87171",
  "Centre Left": "#818cf8",
  "Centre Right": "#fb923c",
  "Centrist": "#a78bfa",
};

export default function ShareCard({ label }: { label: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const color = LABEL_COLORS[label] || "#f5a623";

  const shareText = `I just took the Civiq political compass — I'm ${label.startsWith("Centre") || label === "Centrist" ? "a" : "a"} ${label}.\n\nWhere do you stand on Ontario politics?\n\nciviq.ca`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({ text: shareText });
      } catch {}
      setSharing(false);
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
    >
      {/* The card itself */}
      <div
        ref={cardRef}
        style={{
          backgroundColor: "#0d0d18",
          border: `1px solid ${color}30`,
          borderRadius: "20px",
          padding: "32px 28px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 0 60px ${color}12`,
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "200px", height: "200px", borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "-40px",
          width: "150px", height: "150px", borderRadius: "50%",
          background: `radial-gradient(circle, ${color}0d 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Top label */}
        <div style={{
          fontSize: "10px", fontWeight: "800", letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#333",
          marginBottom: "20px", fontFamily: "'DM Sans', sans-serif",
        }}>
          Civiq · Political Compass
        </div>

        {/* The result */}
        <div style={{
          fontSize: "13px", color: "#444",
          fontWeight: "600", marginBottom: "8px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          I am
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 7vw, 38px)",
          fontWeight: "900",
          color,
          letterSpacing: "-1px",
          lineHeight: 1.1,
          marginBottom: "20px",
        }}>
          {label}
        </div>

        {/* Divider */}
        <div style={{
          height: "1px",
          background: `linear-gradient(90deg, ${color}30, transparent)`,
          marginBottom: "18px",
        }} />

        {/* CTA text */}
        <div style={{
          fontSize: "13px", color: "#555",
          lineHeight: "1.6", fontFamily: "'DM Sans', sans-serif",
          marginBottom: "4px",
        }}>
          Where do you stand on Ontario politics?
        </div>
        <div style={{
          fontSize: "13px", fontWeight: "700", color: color,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          civiq.ca
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNativeShare}
          disabled={sharing}
          style={{
            flex: 1, padding: "14px",
            borderRadius: "12px", border: "none",
            backgroundColor: color,
            color: "#000",
            fontSize: "14px", fontWeight: "700",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s ease",
          }}
        >
          {sharing ? "Opening..." : "Share result →"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCopy}
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: copied ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.02)",
            color: copied ? "#4ade80" : "#555",
            fontSize: "14px", fontWeight: "600",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="copied" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                Copied ✓
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}