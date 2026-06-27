"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const ease = [0.16, 1, 0.3, 1] as const;

const LEANING_CONFIG = {
  left:   { color: "#60a5fa", label: "Left",    bg: "rgba(96,165,250,0.1)"  },
  centre: { color: "#a78bfa", label: "Centre",  bg: "rgba(167,139,250,0.1)" },
  right:  { color: "#f87171", label: "Right",   bg: "rgba(248,113,113,0.1)" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Economy:        "#f5a623",
  Healthcare:     "#f87171",
  Environment:    "#34d399",
  Education:      "#60a5fa",
  Politics:       "#a78bfa",
  Justice:        "#fb923c",
  Society:        "#4ade80",
  Infrastructure: "#94a3b8",
};

type Circle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  memberCount: number;
  isMember: boolean;
};

type Post = {
  id: string;
  circleId: string;
  userId: string;
  username: string;
  content: string;
  leaning: string;
  parentId: string | null;
  likeCount: number;
  liked: boolean;
  replyCount: number;
  createdAt: string;
};

type CircleDetail = {
  circle: Circle;
  memberCount: number;
  leaningBreakdown: { left: number; centre: number; right: number };
  isMember: boolean;
  myLeaning: string | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function LeaningBar({ breakdown, total }: { breakdown: { left: number; centre: number; right: number }; total: number }) {
  if (total === 0) return <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />;
  const pcts = {
    left:   Math.round((breakdown.left   / total) * 100),
    centre: Math.round((breakdown.centre / total) * 100),
    right:  Math.round((breakdown.right  / total) * 100),
  };
  return (
    <div style={{ display: "flex", height: "4px", borderRadius: "4px", overflow: "hidden", gap: "1px" }}>
      {pcts.left   > 0 && <div style={{ width: `${pcts.left}%`,   backgroundColor: "#60a5fa", transition: "width 0.5s ease" }} />}
      {pcts.centre > 0 && <div style={{ width: `${pcts.centre}%`, backgroundColor: "#a78bfa", transition: "width 0.5s ease" }} />}
      {pcts.right  > 0 && <div style={{ width: `${pcts.right}%`,  backgroundColor: "#f87171", transition: "width 0.5s ease" }} />}
    </div>
  );
}

function PostCard({ post, onLike, onReply, onReport, depth = 0 }: {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (post: Post) => void;
  onReport: (postId: string) => void;
  depth?: number;
}) {
  const cfg = LEANING_CONFIG[post.leaning as keyof typeof LEANING_CONFIG] ?? LEANING_CONFIG.centre;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      style={{
        marginLeft: depth > 0 ? "20px" : "0",
        paddingLeft: depth > 0 ? "16px" : "0",
        borderLeft: depth > 0 ? `2px solid ${cfg.color}30` : "none",
        marginBottom: "10px",
      }}
    >
      <div style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "14px",
        padding: "14px 16px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            backgroundColor: cfg.bg,
            border: `1px solid ${cfg.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: "800", color: cfg.color, flexShrink: 0,
          }}>
            {(post.username ?? "A")[0].toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#ccc" }}>
              {post.username ?? "Anonymous"}
            </span>
            <span style={{
              marginLeft: "8px", fontSize: "10px", fontWeight: "700",
              color: cfg.color, backgroundColor: cfg.bg,
              padding: "2px 7px", borderRadius: "100px",
            }}>
              {cfg.label}
            </span>
          </div>
          <span style={{ marginLeft: "auto", fontSize: "11px", color: "#2a2a2a" }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p style={{
          fontSize: "14px", lineHeight: "1.65",
          color: "#bbb", margin: "0 0 10px 0",
          wordBreak: "break-word",
        }}>
          {post.content}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={() => onLike(post.id)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: "600",
              color: post.liked ? "#f5a623" : "#333",
              fontFamily: "'DM Sans', sans-serif",
              transition: "color 0.15s ease",
              padding: 0,
            }}
          >
            <span style={{ fontSize: "14px" }}>{post.liked ? "♥" : "♡"}</span>
            {post.likeCount > 0 && post.likeCount}
          </button>
          {depth === 0 && (
            <button
              onClick={() => onReply(post)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: "600", color: "#333",
                fontFamily: "'DM Sans', sans-serif",
                padding: 0,
              }}
            >
              <span style={{ fontSize: "13px" }}>↩</span>
              {post.replyCount > 0 ? `${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}` : "Reply"}
            </button>
          )}
          <button
            onClick={() => onReport(post.id)}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: "4px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: "11px", fontWeight: "600", color: "#2a2a2a",
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2a2a2a")}
          >
            ⚑ Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CirclesClient({ userId }: { userId: string }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<CircleDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Record<string, Post[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  // Load circles list
  const loadCircles = useCallback(async () => {
    const res = await fetch("/api/circles");
    const data = await res.json();
    if (data.circles) setCircles(data.circles);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadCircles(); }, [loadCircles]);

  // Load circle detail + posts
  const openCircle = useCallback(async (slug: string) => {
    setLoadingDetail(true);
    setView("detail");
    setCompose("");
    setReplyingTo(null);
    setExpandedReplies(new Set());
    setReplies({});

    const detail = await fetch(`/api/circles?slug=${slug}`).then(r => r.json());
    if (!detail.circle) { setLoadingDetail(false); return; }
    setSelectedCircle(detail);

    const postsData = await fetch(`/api/circles/posts?circleId=${detail.circle.id}`).then(r => r.json());
    setPosts(postsData.posts ?? []);
    setLoadingDetail(false);

    // Poll for new posts every 5s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const fresh = await fetch(`/api/circles/posts?circleId=${detail.circle.id}`).then(r => r.json());
      if (fresh.posts) setPosts(fresh.posts);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleBack = () => {
    setView("list");
    setSelectedCircle(null);
    setPosts([]);
    if (pollRef.current) clearInterval(pollRef.current);
    loadCircles();
  };

  const handleJoinToggle = async () => {
    if (!selectedCircle) return;
    setJoining(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId: selectedCircle.circle.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setSelectedCircle(prev => prev ? {
        ...prev,
        isMember: data.joined,
        memberCount: data.joined ? prev.memberCount + 1 : prev.memberCount - 1,
      } : prev);
    }
    setJoining(false);
  };

  const handlePost = async () => {
    if (!compose.trim() || !selectedCircle || posting) return;
    if (!selectedCircle.isMember) return;
    setPosting(true);

    const body: Record<string, string> = {
      circleId: selectedCircle.circle.id,
      content: compose.trim(),
    };
    if (replyingTo) body.parentId = replyingTo.id;

    const res = await fetch("/api/circles/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok && data.post) {
      if (replyingTo) {
        setReplies(prev => ({
          ...prev,
          [replyingTo.id]: [data.post, ...(prev[replyingTo.id] ?? [])],
        }));
        setExpandedReplies(prev => new Set([...prev, replyingTo.id]));
        // Update reply count on parent post
        setPosts(prev => prev.map(p => p.id === replyingTo.id ? { ...p, replyCount: p.replyCount + 1 } : p));
      } else {
        setPosts(prev => [data.post, ...prev]);
      }
      setCompose("");
      setReplyingTo(null);
    }
    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    const res = await fetch("/api/circles/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (res.ok) {
      const update = (list: Post[]) => list.map(p =>
        p.id === postId
          ? { ...p, liked: data.liked, likeCount: p.likeCount + (data.liked ? 1 : -1) }
          : p
      );
      setPosts(update);
      setReplies(prev => {
        const next = { ...prev };
        for (const key in next) next[key] = update(next[key]);
        return next;
      });
    }
  };

  const handleReply = (post: Post) => {
    setReplyingTo(post);
    setTimeout(() => composeRef.current?.focus(), 100);
  };

  const handleReport = async (postId: string) => {
    const reason = prompt("Why are you reporting this post?\n\n• Hate speech\n• Misinformation\n• Spam\n• Harassment\n• Other");
    if (!reason?.trim()) return;
    try {
      await fetch("/api/circles/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reason: reason.trim() }),
      });
      alert("Report submitted. We'll review it shortly.");
    } catch {
      alert("Failed to submit report. Please try again.");
    }
  };

  const loadReplies = async (postId: string, circleId: string) => {
    if (expandedReplies.has(postId)) {
      setExpandedReplies(prev => { const next = new Set(prev); next.delete(postId); return next; });
      return;
    }
    const data = await fetch(`/api/circles/posts?circleId=${circleId}&parentId=${postId}`).then(r => r.json());
    setReplies(prev => ({ ...prev, [postId]: data.posts ?? [] }));
    setExpandedReplies(prev => new Set([...prev, postId]));
  };

  const categories = ["All", ...Array.from(new Set(circles.map(c => c.category)))];
  const filtered = circles.filter(c => {
    const matchCat = filter === "All" || c.category === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <AppLayout active="/circles">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          .circle-card { transition: border-color 0.2s ease, transform 0.2s ease; }
          .circle-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }
          .cat-pill { transition: all 0.15s ease; }
          input::placeholder, textarea::placeholder { color: #333; }
        `}</style>
        <div style={{ padding: "28px 20px", maxWidth: "780px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
            <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
              Civic Circles
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "6px" }}>
              Find your conversation
            </div>
            <div style={{ fontSize: "14px", color: "#444", marginBottom: "24px" }}>
              Join a Circle, share your take, hear the other side.
            </div>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search circles..."
              style={{
                width: "100%", padding: "11px 16px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px", color: "#fff",
                fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                outline: "none", marginBottom: "14px",
                boxSizing: "border-box",
              }}
            />
          </motion.div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}
            style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "28px" }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                className="cat-pill"
                onClick={() => setFilter(cat)}
                style={{
                  padding: "5px 14px", borderRadius: "100px",
                  fontSize: "12px", fontWeight: "600",
                  border: filter === cat ? `1px solid ${CATEGORY_COLORS[cat] ?? "#f5a623"}` : "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: filter === cat ? `${CATEGORY_COLORS[cat] ?? "#f5a623"}15` : "transparent",
                  color: filter === cat ? (CATEGORY_COLORS[cat] ?? "#f5a623") : "#444",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Circles grid */}
          {loadingList ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                  style={{ height: "100px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#333", fontSize: "14px" }}>No circles found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map((circle, i) => {
                const catColor = CATEGORY_COLORS[circle.category] ?? "#f5a623";
                return (
                  <motion.div
                    key={circle.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease }}
                    className="circle-card"
                    onClick={() => openCircle(circle.slug)}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px", padding: "18px 20px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                        backgroundColor: `${catColor}12`,
                        border: `1px solid ${catColor}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px",
                      }}>
                        {circle.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: "#f0ede6" }}>{circle.title}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: "700", color: catColor,
                            backgroundColor: `${catColor}12`, padding: "2px 8px", borderRadius: "100px",
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>
                            {circle.category}
                          </span>
                          {circle.isMember && (
                            <span style={{
                              fontSize: "10px", fontWeight: "700", color: "#34d399",
                              backgroundColor: "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: "100px",
                            }}>
                              Joined
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#444", lineHeight: "1.5", marginBottom: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {circle.description}
                        </div>
                        <div style={{ fontSize: "11px", color: "#2a2a2a", fontWeight: "600" }}>
                          {circle.memberCount.toLocaleString()} {circle.memberCount === 1 ? "member" : "members"}
                        </div>
                      </div>
                      <div style={{ color: "#2a2a2a", fontSize: "16px", flexShrink: 0, alignSelf: "center" }}>›</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  const d = selectedCircle;
  const total = d ? d.leaningBreakdown.left + d.leaningBreakdown.centre + d.leaningBreakdown.right : 0;
  const catColor = d ? (CATEGORY_COLORS[d.circle.category] ?? "#f5a623") : "#f5a623";

  return (
    <AppLayout active="/circles">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .post-compose:focus { border-color: rgba(245,166,35,0.3) !important; }
        textarea::placeholder { color: #333; }
        input::placeholder { color: #333; }
      `}</style>
      <div style={{ padding: "0", maxWidth: "780px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Sticky header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          backgroundColor: "#06060c",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <button
            onClick={handleBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#555", fontSize: "18px", padding: "0",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center",
            }}
          >
            ←
          </button>
          {d && (
            <>
              <span style={{ fontSize: "20px" }}>{d.circle.emoji}</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#f0ede6", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.circle.title}
              </span>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleJoinToggle}
                disabled={joining}
                style={{
                  padding: "7px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: "700",
                  border: d.isMember ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(245,166,35,0.4)",
                  backgroundColor: d.isMember ? "rgba(52,211,153,0.08)" : "rgba(245,166,35,0.1)",
                  color: d.isMember ? "#34d399" : "#f5a623",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  flexShrink: 0,
                }}
              >
                {joining ? "..." : d.isMember ? "Joined ✓" : "Join"}
              </motion.button>
            </>
          )}
        </div>

        {loadingDetail ? (
          <div style={{ padding: "32px 20px" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: "90px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "14px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : d ? (
          <div style={{ padding: "16px 20px 120px" }}>

            {/* Circle info card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: `1px solid ${catColor}20`,
                borderRadius: "16px", padding: "18px 20px", marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6", marginBottom: "14px" }}>
                {d.circle.description}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#333", fontWeight: "600" }}>
                  {d.memberCount.toLocaleString()} {d.memberCount === 1 ? "member" : "members"}
                </span>
                {total > 0 && (
                  <span style={{ fontSize: "11px", color: "#333" }}>
                    {Math.round((d.leaningBreakdown.left / total) * 100)}% left · {Math.round((d.leaningBreakdown.centre / total) * 100)}% centre · {Math.round((d.leaningBreakdown.right / total) * 100)}% right
                  </span>
                )}
              </div>
              <LeaningBar breakdown={d.leaningBreakdown} total={total} />
            </motion.div>

            {/* Compose box */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3, ease }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px", padding: "16px", marginBottom: "20px",
              }}
            >
              {replyingTo && (
                <div style={{
                  fontSize: "12px", color: "#444", marginBottom: "10px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>↩ Replying to <strong style={{ color: "#666" }}>{replyingTo.username}</strong></span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#333", fontSize: "14px" }}
                  >✕</button>
                </div>
              )}
              <textarea
                ref={composeRef}
                className="post-compose"
                value={compose}
                onChange={e => setCompose(e.target.value.slice(0, 280))}
                placeholder={d.isMember ? (replyingTo ? "Write your reply..." : "Share your take...") : "Join this Circle to post"}
                disabled={!d.isMember}
                rows={3}
                style={{
                  width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px", color: d.isMember ? "#ccc" : "#333",
                  fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                  resize: "none", outline: "none", padding: "10px 12px",
                  lineHeight: "1.6", boxSizing: "border-box",
                  transition: "border-color 0.2s ease",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                <span style={{ fontSize: "11px", color: compose.length > 250 ? "#f87171" : "#2a2a2a", fontWeight: "600" }}>
                  {compose.length}/280
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!d.isMember && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleJoinToggle}
                      style={{
                        padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                        backgroundColor: "#f5a623", color: "#000",
                        border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Join to post
                    </motion.button>
                  )}
                  {d.isMember && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handlePost}
                      disabled={!compose.trim() || posting}
                      style={{
                        padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                        backgroundColor: compose.trim() ? "#f5a623" : "rgba(255,255,255,0.04)",
                        color: compose.trim() ? "#000" : "#333",
                        border: "none", cursor: compose.trim() ? "pointer" : "not-allowed",
                        fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s ease",
                      }}
                    >
                      {posting ? "Posting..." : replyingTo ? "Reply" : "Post"}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Posts feed */}
            {posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ textAlign: "center", padding: "48px 0", color: "#2a2a2a", fontSize: "14px" }}
              >
                No posts yet. {d.isMember ? "Be the first to share your take." : "Join to start the conversation."}
              </motion.div>
            ) : (
              <AnimatePresence>
                {posts.map((post, i) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      onLike={handleLike}
                      onReply={handleReply}
                      onReport={handleReport}
                    />
                    {/* Reply toggle */}
                    {post.replyCount > 0 && (
                      <button
                        onClick={() => loadReplies(post.id, d.circle.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: "12px", color: "#444", fontWeight: "600",
                          fontFamily: "'DM Sans', sans-serif",
                          marginLeft: "20px", marginBottom: "8px", padding: 0,
                        }}
                      >
                        {expandedReplies.has(post.id) ? "▲ Hide replies" : `▼ Show ${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}`}
                      </button>
                    )}
                    {/* Replies */}
                    <AnimatePresence>
                      {expandedReplies.has(post.id) && replies[post.id]?.map(reply => (
                        <PostCard
                          key={reply.id}
                          post={reply}
                          onLike={handleLike}
                          onReply={handleReply}
                          onReport={handleReport}
                          depth={1}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}