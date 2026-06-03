"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

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
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

export default function BookmarksClient({ bookmarks: initial }: {
  bookmarks: { id: string; cardTitle: string; cardSummary: string; cardCategory: string; cardSource: string; savedAt: string }[]
}) {
  const [bookmarks, setBookmarks] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (bookmark: typeof initial[0]) => {
    setRemoving(bookmark.id);
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardTitle: bookmark.cardTitle, cardSummary: bookmark.cardSummary }),
    });
    setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
    setRemoving(null);
  };

  return (
    <AppLayout active="/bookmarks">
      <div style={{ padding: "40px 24px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "36px" }}
        >
          <div style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "4px" }}>Saved</div>
          <div style={{ fontSize: "14px", color: "#444" }}>
            {bookmarks.length} {bookmarks.length === 1 ? "article" : "articles"} saved
          </div>
        </motion.div>

        {bookmarks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "64px 0" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏷️</div>
            <div style={{ fontSize: "16px", color: "#555", marginBottom: "8px" }}>No saved articles yet</div>
            <div style={{ fontSize: "13px", color: "#333" }}>Tap the bookmark icon on any feed card to save it here.</div>
          </motion.div>
        )}

        <AnimatePresence>
          {bookmarks.map((bookmark, i) => {
            const color = CATEGORY_COLORS[bookmark.cardCategory] || CATEGORY_COLORS.default;
            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "700", color,
                        backgroundColor: `${color}15`,
                        padding: "2px 8px", borderRadius: "100px",
                        letterSpacing: "0.05em", textTransform: "uppercase",
                      }}>{bookmark.cardCategory}</span>
                      <span style={{ fontSize: "12px", color: "#333" }}>{timeAgo(bookmark.savedAt)}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "-0.2px", marginBottom: "8px", lineHeight: "1.4" }}>
                      {bookmark.cardTitle}
                    </div>
                    <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
                      {bookmark.cardSummary}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemove(bookmark)}
                    disabled={removing === bookmark.id}
                    style={{
                      background: "none", border: "none",
                      color: "#333", fontSize: "18px",
                      cursor: "pointer", flexShrink: 0,
                      opacity: removing === bookmark.id ? 0.5 : 1,
                    }}
                  >
                    ×
                  </motion.button>
                </div>
                {bookmark.cardSource && (
                  <div style={{ fontSize: "12px", color: "#333" }}>{bookmark.cardSource}</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}