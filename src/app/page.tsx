"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Logo from "@/components/Logo";
import { useAuth } from "@clerk/nextjs";

const TICKER_ITEMS = [
  "Ontario Bill 212 · Education Funding",
  "Doug Ford · Housing Policy",
  "Federal Budget 2025",
  "Minimum Wage Debate",
  "Healthcare Wait Times",
  "Student Debt Crisis",
  "Electoral Reform",
  "Climate Policy Ontario",
  "Transit Expansion",
  "Youth Voter Turnout",
];

const WORDS = ["Politics.", "Democracy.", "Your Province.", "Your Future.", "Your Ground."];

const STATS = [
  { num: "60+", label: "Learning modules" },
  { num: "5 min", label: "To understand any issue" },
  { num: "0", label: "Political bias" },
];

const FEATURES = [
  {
    icon: "🧭",
    title: "Know where you stand",
    desc: "A political compass quiz built around real Ontario issues — not American ones.",
    color: "rgba(245,166,35,0.08)",
    border: "rgba(245,166,35,0.2)",
  },
  {
    icon: "📰",
    title: "Live Ontario feed",
    desc: "Active bills and issues with left, centre, and right perspectives laid out side by side.",
    color: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.15)",
  },
  {
    icon: "🗳️",
    title: "Poll on real issues",
    desc: "Vote on issues affecting your life and see where Gen Z actually stands.",
    color: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  {
    icon: "📚",
    title: "Learn in 5 minutes",
    desc: "200+ bite-sized modules on government, ideologies, and the figures who shaped history.",
    color: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
  {
    icon: "⏳",
    title: "Witness",
    desc: "Live countdowns on real Ontario political decisions — bills, rulings, elections. Know before it happens.",
    color: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.15)",
  },
  {
    icon: "🔮",
    title: "Civic Forecast",
    desc: "Predict what happens in Ontario politics. Set your confidence, earn points, climb the leaderboard.",
    color: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  {
    icon: "🔵",
    title: "Civic Circles",
    desc: "Join issue-based groups. Post your take, reply to others, and see how the left, centre and right split.",
    color: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.15)",
  },
  {
    icon: "💬",
    title: "Structured debate",
    desc: "Get matched with someone who disagrees. Steelman their view first — then argue.",
    color: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.15)",
  },
  {
    icon: "🎯",
    title: "Weekly challenges",
    desc: "3 missions every Monday designed to push you outside your political comfort zone.",
    color: "rgba(245,166,35,0.06)",
    border: "rgba(245,166,35,0.15)",
  },
  {
    icon: "📖",
    title: "Follow storylines",
    desc: "Track ongoing Ontario political stories chapter by chapter as they develop.",
    color: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  {
    icon: "🗺️",
    title: "Regional map",
    desc: "See how different parts of Ontario vote on the issues that matter to you.",
    color: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
];

const ISSUE_OF_WEEK = {
  tag: "THIS WEEK",
  title: "Ontario's new housing bill strips municipal zoning powers",
  summary: "Bill 185 lets developers bypass local planning rules to fast-track housing. Supporters say it's necessary to hit 1.5M homes by 2031. Critics say it guts community input and will worsen infrastructure gaps.",
  perspectives: [
    { side: "Conservative", color: "#60a5fa", view: "Cutting red tape is the only way to fix the housing crisis at scale. Municipalities have delayed development for decades." },
    { side: "Liberal / NDP", color: "#a78bfa", view: "Removing community oversight hands power to developers with no accountability. Affordability isn't guaranteed." },
    { side: "Non-partisan", color: "#34d399", view: "The tradeoff is real: speed vs. local democracy. Ontario needs both supply and accountability mechanisms." },
  ],
};

// PWA splash screen — shown only when launched from home screen
function AppSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "#06060c",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "0",
      }}
    >
      {/* animated background orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", width: "400px", height: "400px",
          borderRadius: "50%", top: "10%", left: "50%", transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: "absolute", width: "300px", height: "300px",
          borderRadius: "50%", bottom: "15%", right: "10%",
          background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "28px" }}
      >
        <Logo size={1.1} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        style={{ fontSize: "13px", color: "#444", letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif" }}
      >
        Your civic IQ, levelled up.
      </motion.div>

      {/* loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{
          position: "absolute", bottom: "60px",
          width: "120px", height: "2px",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: "2px", overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 1.4, ease: "easeInOut" }}
          style={{ height: "100%", backgroundColor: "#f5a623", borderRadius: "2px" }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isPWA, setIsPWA] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const heroY = useTransform(scrollY, [0, 300], [0, 40]);

  useEffect(() => {
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) {
      setIsPWA(true);
      return;
    }
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const android = /android/.test(navigator.userAgent.toLowerCase());
    if (ios) { setIsIOS(true); setShowInstall(true); }
    if (android) {
      const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
      window.addEventListener("beforeinstallprompt", handler as any);
      return () => window.removeEventListener("beforeinstallprompt", handler as any);
    }
  }, []);

  // If PWA and splash done, redirect into app
  useEffect(() => {
    if (isPWA && splashDone) {
      window.location.href = "/dashboard";
    }
  }, [isPWA, splashDone]);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSHint(h => !h); return; }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
  };

  // Typewriter
  useEffect(() => {
    const current = WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 40);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIndex(i => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIndex]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.08); }
          66% { transform: translate(20px, -10px) scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .ticker-track { display: flex; animation: ticker 36s linear infinite; width: max-content; }
        .ticker-track:hover { animation-play-state: paused; }

        .btn-amber {
          background: linear-gradient(135deg, #f5a623 0%, #e8921a 100%);
          color: #0a0800;
          padding: 16px 40px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.2px;
          position: relative;
          overflow: hidden;
        }
        .btn-amber::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-amber:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(245,166,35,0.35); }
        .btn-amber:hover::before { opacity: 1; }
        .btn-amber:active { transform: translateY(0); }

        .btn-ghost {
          background: rgba(255,255,255,0.04);
          color: #888;
          padding: 16px 40px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          border: 1px solid rgba(255,255,255,0.08);
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: #ccc; background: rgba(255,255,255,0.07); }

        .feature-card {
          border-radius: 18px;
          padding: 28px;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.35s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04) 0%, transparent 60%);
        }
        .feature-card:hover { transform: translateY(-4px) scale(1.01); border-color: rgba(255,255,255,0.12); }
        .feature-card:hover::after { opacity: 1; }

        .nav-link-item {
          color: #555;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 7px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .nav-link-item:hover { color: #aaa; }

        .shimmer-text {
          background: linear-gradient(90deg, #f5a623 0%, #ffd280 40%, #f5a623 60%, #e8921a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .scroll-indicator { animation: float 2.5s ease-in-out infinite; }

        .pulse-dot {
          position: relative;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #f5a623;
          display: inline-block;
        }
        .pulse-dot::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1.5px solid #f5a623;
          animation: pulse-ring 1.8s ease-out infinite;
        }

        @media (max-width: 640px) {
          .scroll-indicator { display: none; }
          .nav-cta { display: none !important; }
          .bg-orbs { display: none; }
          .hero-title { font-size: 38px !important; letter-spacing: -1.5px !important; }
          .hero-sub { font-size: 15px !important; max-width: 100% !important; }
          .cta-row { flex-direction: column !important; }
          .btn-amber, .btn-ghost { text-align: center; width: 100%; justify-content: center; padding: 15px 0 !important; }
          .section-inner { padding: 64px 20px !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .feature-card { padding: 18px !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .stat-num { font-size: 26px !important; }
          .stats-grid > div { padding: 28px 8px !important; }
          .hero-section { padding: 56px 20px 48px !important; }
          .ticker-label { display: none; }
          .nav-links { display: none !important; }
          .footer-inner { flex-direction: column !important; text-align: center; gap: 8px !important; }
          .final-cta-section { padding: 72px 20px !important; }
          .perspectives-grid { grid-template-columns: 1fr !important; }
          }

        @media (min-width: 641px) and (max-width: 1024px) {
          .hero-section { padding: 72px 40px 64px !important; }
          .section-inner { padding: 72px 40px !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* PWA splash */}
      <AnimatePresence>
        {isPWA && !splashDone && (
          <AppSplash onDone={() => setSplashDone(true)} />
        )}
      </AnimatePresence>

      <div style={{ minHeight: "100vh", backgroundColor: "#06060c", color: "#e8e6e0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

        {/* Background ambient orbs (desktop) */}
          <div className="bg-orbs" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", width: "600px", height: "600px",
            borderRadius: "50%", top: "-100px", left: "-100px",
            background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)",
            animation: "orb1 18s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: "500px", height: "500px",
            borderRadius: "50%", bottom: "0px", right: "-100px",
            background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)",
            animation: "orb2 22s ease-in-out infinite",
          }} />
        </div>

        {/* LIVE TICKER */}
        <div style={{ position: "relative", zIndex: 10, backgroundColor: "rgba(6,6,12,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)", height: "30px", display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div className="ticker-label" style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)", fontSize: "9px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5a623", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "7px" }}>
            <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
            LIVE
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{ padding: "0 28px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.05em", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.04)", color: "#666" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(6,6,12,0.88)", backdropFilter: "blur(24px)" }}
        >
          <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 48px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Logo size={0.7} href="/" />
            <div className="nav-links" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <a href="#features" className="nav-link-item">Features</a>
              <a href="#about" className="nav-link-item">About</a>
              {!isSignedIn && <Link href="/sign-in" className="nav-link-item">Sign in</Link>}
            </div>
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="btn-amber nav-cta" style={{ padding: "9px 16px", fontSize: "13px", borderRadius: "9px", whiteSpace: "nowrap" }}>
              {isSignedIn ? "Go to dashboard →" : "Get started →"}
            </Link>
          </div>
        </motion.nav>

        {/* HERO */}
        <motion.div
          ref={heroRef}
          style={{ opacity: heroOpacity, y: heroY, position: "relative", zIndex: 5 }}
        >
          <div className="hero-section" style={{ maxWidth: "1160px", margin: "0 auto", padding: "100px 48px 90px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

            {/* badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "40px", alignSelf: "flex-start" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "100px", backgroundColor: "rgba(245,166,35,0.06)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5a623" }}>
                <span className="pulse-dot" />
                Ontario Civic Platform · Powered by CCF
              </div>
            </motion.div>

            {/* headline */}
            <div style={{ marginBottom: "32px" }}>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="hero-title"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(52px, 7.5vw, 88px)",
                  fontWeight: "900",
                  lineHeight: "1.02",
                  letterSpacing: "-3px",
                  color: "#f0ede6",
                  marginBottom: "2px",
                }}
              >
                Understand
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="hero-title shimmer-text"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(52px, 7.5vw, 88px)",
                  fontWeight: "900",
                  lineHeight: "1.02",
                  letterSpacing: "-3px",
                  minHeight: "1.1em",
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                {displayed}
                <span style={{ display: "inline-block", width: "3px", height: "0.75em", backgroundColor: "#f5a623", marginLeft: "4px", verticalAlign: "middle", animation: "blink 1s infinite", borderRadius: "2px" }} />
              </motion.div>
            </div>

            {/* sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="hero-sub"
              style={{ fontSize: "19px", color: "#4a4a4a", lineHeight: "1.75", maxWidth: "500px", marginBottom: "48px", fontWeight: "400" }}
            >
              Politics shapes your rent, your healthcare, your school.{" "}
              <span style={{ color: "#666" }}>Civiq makes it actually make sense — no spin, no sides, just clarity.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="cta-row"
              style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: showIOSHint ? "20px" : "0" }}
            >
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="btn-amber">Start for free →</Link>
              <Link href="/learn" className="btn-ghost">Explore modules</Link>
              {showInstall && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleInstall}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "16px 24px", borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "#ccc", fontSize: "15px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  📲 Add to Home Screen
                </motion.button>
              )}
            </motion.div>

            {showIOSHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: "16px", padding: "14px 18px", borderRadius: "12px",
                  backgroundColor: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.18)",
                  fontSize: "13px", color: "#888", lineHeight: "1.65", maxWidth: "380px",
                }}
              >
                Tap the <strong style={{ color: "#f5a623" }}>Share</strong> button in Safari, then{" "}
                <strong style={{ color: "#f5a623" }}>"Add to Home Screen"</strong> to install Civiq.
              </motion.div>
            )}

            {/* scroll hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="scroll-indicator"
              style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
            >
              <div style={{ fontSize: "10px", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "700" }}>Scroll</div>
              <div style={{ width: "1px", height: "32px", background: "linear-gradient(to bottom, #666, transparent)" }} />
            </motion.div>

          </div>
        </motion.div>

        {/* PREVIEW CARD — floating mock */}
            <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 16px 56px", marginTop: "0" }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%", maxWidth: "560px",
              backgroundColor: "rgba(14,14,22,0.95)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "24px",
              padding: "28px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* mock top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", display: "flex", alignItems: "center", gap: "7px" }}>
                <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
                Today in Ontario
              </div>
              <div style={{ fontSize: "11px", color: "#666", fontWeight: "600" }}>{new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</div>
            </div>

            {[
              { tag: "HOUSING", title: "Ford government cuts municipal review powers", time: "2h ago", dot: "#f5a623" },
              { tag: "EDUCATION", title: "Bill 212 passes third reading in legislature", time: "4h ago", dot: "#60a5fa" },
              { tag: "BUDGET", title: "Province announces $3.2B infrastructure spend", time: "6h ago", dot: "#a78bfa" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                style={{ paddingBottom: i < 2 ? "16px" : 0, marginBottom: i < 2 ? "16px" : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                  <span style={{
                    fontSize: "9px", fontWeight: "800", letterSpacing: "0.08em",
                    color: item.dot, backgroundColor: `${item.dot}18`,
                    padding: "2px 8px", borderRadius: "3px",
                  }}>{item.tag}</span>
                  <span style={{ fontSize: "11px", color: "#666" }}>{item.time}</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#aaa", lineHeight: "1.5" }}>{item.title}</div>
              </motion.div>
            ))}

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>Your political position</span>
              <Link href="/sign-up" style={{ fontSize: "12px", fontWeight: "700", color: "#f5a623", textDecoration: "none" }}>Take the quiz →</Link>
            </div>
          </motion.div>
        </div>

        {/* STATS */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(10,10,16,0.8)", position: "relative", zIndex: 5 }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{ padding: "40px 24px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="stat-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: "44px", fontWeight: "900", letterSpacing: "-1.5px", lineHeight: "1", marginBottom: "8px" }}>
                    <span className="shimmer-text">{s.num}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#555", fontWeight: "600", letterSpacing: "0.04em" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div id="features" style={{ position: "relative", zIndex: 5 }}>
          <div className="section-inner" style={{ maxWidth: "1160px", margin: "0 auto", padding: "100px 48px" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: "56px" }}
            >
              <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5a623", marginBottom: "12px" }}>What's inside</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: "900", letterSpacing: "-1px", color: "#f0ede6", lineHeight: "1.1", maxWidth: "560px" }}>
                Everything you need to get{" "}
                <em style={{ fontStyle: "italic", color: "#f5a623" }}>actually</em> informed.
              </h2>
            </motion.div>

              <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>lea
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="feature-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.55 }}
                  style={{ backgroundColor: f.color, borderColor: f.border }}
                >
                  <div style={{ fontSize: "26px", marginBottom: "16px" }}>{f.icon}</div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#e0ddd8", marginBottom: "8px", lineHeight: "1.3" }}>{f.title}</div>
                  <div style={{ fontSize: "13px", color: "#444", lineHeight: "1.7" }}>{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* QUOTE */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(8,8,14,0.9)", padding: "88px 48px", textAlign: "center", position: "relative", zIndex: 5 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: "640px", margin: "0 auto" }}
          >
            <div style={{ fontFamily: "Georgia, serif", fontSize: "60px", color: "#f5a623", lineHeight: "1", marginBottom: "16px", opacity: 0.6 }}>"</div>
            <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: "700", color: "#888", lineHeight: "1.6", letterSpacing: "-0.3px", marginBottom: "24px", fontStyle: "italic" }}>
              What is the first part of politics? Education. The second? Education. And the third? Education.
            </blockquote>
            <cite style={{ fontSize: "11px", color: "#555", fontStyle: "normal", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase" }}>Jules Michelet</cite>
          </motion.div>
        </div>

        {/* CCF STRIP */}
<div id="about" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(6,6,12,0.95)", padding: "56px 48px", position: "relative", zIndex: 5 }}>
  <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{ display: "flex", alignItems: "center", gap: "48px", flexWrap: "wrap" }}
    >
      {/* Logos */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))",
            border: "1px solid rgba(245,166,35,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontFamily: "'Playfair Display', serif", fontWeight: "900", color: "#f5a623",
          }}>Q</div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#f0ede6", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Civiq</div>
        </div>

        <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.08)" }} />

        <a href="https://www.civicclarityfoundation.org" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <img
            src="/ccf-logo.png"
            alt="Civic Clarity Foundation"
            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#e8e6e0" }}>Civic Clarity Foundation</div>
            <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>civicclarityfoundation.org ↗</div>
          </div>
        </a>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "60px", backgroundColor: "rgba(255,255,255,0.05)", flexShrink: 0 }} className="ccf-divider" />

      {/* Text */}
      <div style={{ flex: 1, minWidth: "260px" }}>
        <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em", color: "#f5a623", textTransform: "uppercase", marginBottom: "10px" }}>In partnership with</div>
        <div style={{ fontSize: "15px", color: "#666", lineHeight: "1.75", maxWidth: "480px" }}>
          Civiq is built in partnership with the Civic Clarity Foundation — a non-partisan, youth-focused think tank committed to governmental transparency, accountability, and meaningful youth inclusion in democracy.
        </div>
      </div>
    </motion.div>
  </div>
</div>

        {/* ISSUE OF THE WEEK */}
        <div style={{ position: "relative", zIndex: 5, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="section-inner" style={{ maxWidth: "1160px", margin: "0 auto", padding: "80px 48px" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span className="pulse-dot" />
                <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5a623" }}>{ISSUE_OF_WEEK.tag}</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: "900", color: "#f0ede6", letterSpacing: "-0.5px", lineHeight: "1.2", marginBottom: "14px", maxWidth: "680px" }}>
                {ISSUE_OF_WEEK.title}
              </h2>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.8", maxWidth: "600px", marginBottom: "36px" }}>
                {ISSUE_OF_WEEK.summary}
              </p>

              <div className="perspectives-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "36px" }}>
                {ISSUE_OF_WEEK.perspectives.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      backgroundColor: `${p.color}08`,
                      border: `1px solid ${p.color}22`,
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: p.color, marginBottom: "10px" }}>{p.side}</div>
                    <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>{p.view}</div>
                  </motion.div>
                ))}
              </div>

              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="btn-amber"
                style={{ fontSize: "14px", padding: "13px 28px" }}
              >
                {isSignedIn ? "Read full breakdown →" : "Sign up to read more →"}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div style={{ position: "relative", zIndex: 5 }}>
            <div className="section-inner final-cta-section" style={{ maxWidth: "1160px", margin: "0 auto", padding: "120px 48px", textAlign: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", color: "#666", marginBottom: "24px" }}>Ready?</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: "900", letterSpacing: "-2px", color: "#f0ede6", marginBottom: "20px", lineHeight: "1.06" }}>
                Your province.<br />
                Your politics.<br />
                <span className="shimmer-text">Your ground.</span>
              </h2>
              <p style={{ fontSize: "16px", color: "#555", marginBottom: "48px", lineHeight: "1.8", maxWidth: "420px", margin: "0 auto 48px" }}>
                No algorithm. No outrage bait. Just the information you need to form your own view.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="btn-amber">Start for free →</Link>
                <Link href="/learn" className="btn-ghost">Explore modules</Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px 48px", backgroundColor: "rgba(6,6,12,0.98)", position: "relative", zIndex: 5 }}>
          <div className="footer-inner" style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "#1e1e1e" }}>Built by Shahmeer · Powered by Civic Clarity Foundation · Ontario, Canada</div>
            <div style={{ fontSize: "12px", color: "#1e1e1e" }}>© 2025 Civiq. All rights reserved.</div>
          </div>
        </footer>

      </div>
    </>
  );
}
