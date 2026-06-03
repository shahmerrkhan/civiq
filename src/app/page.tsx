"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const WORDS = ["Politics.", "Democracy.", "Your Province.", "Your Future.", "Your Ground."];

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

const features = [
  { icon: "🧭", title: "Know where you stand", desc: "A political compass quiz built around real Ontario issues — not American ones." },
  { icon: "📰", title: "Live Ontario feed", desc: "Active bills and issues with left, centre, and right perspectives laid out side by side." },
  { icon: "🗳️", title: "Poll on real issues", desc: "Vote on issues affecting your life and see where Gen Z actually stands." },
  { icon: "📚", title: "Learn in 5 minutes", desc: "60+ bite-sized modules on government, ideologies, and the figures who shaped history." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const android = /android/.test(navigator.userAgent.toLowerCase());
    const standalone = (window.navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return; // already installed
    if (ios) { setIsIOS(true); setShowInstall(true); }
    if (android) {
      const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
      window.addEventListener("beforeinstallprompt", handler as any);
      return () => window.removeEventListener("beforeinstallprompt", handler as any);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSHint(h => !h); return; }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
  };

  useEffect(() => {
    const current = WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-track {
          display: flex;
          animation: ticker 32s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }

        .cta-amber {
          background-color: #f5a623;
          color: #0a0800;
          padding: 15px 36px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .cta-amber:hover { background-color: #e09520; transform: translateY(-1px); }

        .cta-ghost {
          background-color: transparent;
          color: #aaa;
          padding: 15px 36px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'DM Sans', sans-serif;
        }
        .cta-ghost:hover { border-color: rgba(255,255,255,0.25); color: #fff; }

        .feature-card {
          background-color: #141414;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: rgba(245,166,35,0.25);
          transform: translateY(-2px);
          background-color: rgba(245,166,35,0.03);
        }

        .stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background-color: #111;
        }

        .stat-cell {
          padding: 32px 24px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .stat-cell:last-child { border-right: none; }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .nav-inner { padding: 0 20px !important; }
          .hero-section { padding: 56px 20px 48px !important; }
          .hero-title { font-size: 48px !important; letter-spacing: -2px !important; }
          .hero-sub { font-size: 16px !important; }
          .cta-row { flex-direction: column !important; }
          .cta-amber, .cta-ghost { text-align: center; width: 100%; padding: 15px 0 !important; }
          .feed-card { margin-top: 40px !important; }
          .section-pad { padding: 64px 20px !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .quote-section { padding: 64px 20px !important; }
          .stat-cell { padding: 24px 12px !important; }
          .stat-num { font-size: 32px !important; }
          .partner-inner { flex-direction: column !important; gap: 10px !important; align-items: flex-start !important; }
          .footer-inner { flex-direction: column !important; text-align: center; gap: 8px !important; }
          .final-cta { padding: 72px 20px !important; }
          .ticker-label { display: none; }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .hero-section { padding: 72px 40px 64px !important; }
          .section-pad { padding: 72px 40px !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", color: "#e8e6e0", fontFamily: "'DM Sans', sans-serif" }}>

        {/* TICKER */}
        <div style={{ backgroundColor: "#111", borderBottom: "1px solid rgba(255,255,255,0.06)", height: "32px", display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div className="ticker-label" style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.08)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", whiteSpace: "nowrap" }}>
            LIVE · ONTARIO
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{ padding: "0 24px", fontSize: "11px", fontWeight: "500", letterSpacing: "0.04em", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.05)", color: "#666" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(13,13,13,0.94)", backdropFilter: "blur(16px)" }}
        >
          <div className="nav-inner" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Logo size={0.7} href="/" />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link href="/sign-in" style={{ color: "#555", textDecoration: "none", fontSize: "14px", fontWeight: "500", padding: "8px 14px", borderRadius: "8px", transition: "color 0.2s ease" }}>
                Sign in
              </Link>
              <Link href="/sign-up" style={{ backgroundColor: "#f5a623", color: "#0a0800", padding: "8px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", textDecoration: "none", transition: "all 0.2s ease" }}>
                Get started
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* HERO */}
        <div className="hero-section" style={{ maxWidth: "1100px", margin: "0 auto", padding: "88px 48px 80px" }}>
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* BADGE */}
            <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", marginBottom: "28px", padding: "5px 12px", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px", backgroundColor: "rgba(245,166,35,0.06)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#f5a623", display: "inline-block" }} />
              Ontario Civic Platform · Powered by CCF
            </motion.div>

            {/* HEADLINE */}
            <motion.h1 variants={fadeUp} className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px, 7vw, 80px)", fontWeight: "900", lineHeight: "1.03", letterSpacing: "-2.5px", color: "#f0ede6", marginBottom: "4px" }}>
              Understand
            </motion.h1>
            <motion.div variants={fadeUp} className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px, 7vw, 80px)", fontWeight: "900", lineHeight: "1.03", letterSpacing: "-2.5px", color: "#f5a623", marginBottom: "28px", minHeight: "1.08em" }}>
              {displayed}
              <span style={{ display: "inline-block", width: "3px", height: "0.75em", backgroundColor: "#f5a623", marginLeft: "3px", verticalAlign: "middle", animation: "blink 1s infinite" }} />
            </motion.div>

            {/* SUB */}
            <motion.p variants={fadeUp} className="hero-sub" style={{ fontSize: "18px", color: "#555", lineHeight: "1.75", maxWidth: "480px", marginBottom: "40px" }}>
              Politics shapes your rent, your healthcare, your school. Civiq makes it actually make sense — no spin, no sides, just clarity.
            </motion.p>

            {/* BUTTONS */}
            <motion.div variants={fadeUp} className="cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: showIOSHint ? "16px" : "64px" }}>
              <Link href="/sign-up" className="cta-amber">Start for free</Link>
              <Link href="/learn" className="cta-ghost">Explore modules</Link>
              {showInstall && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleInstall}
                  style={{
                    padding: "15px 24px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "#fff", fontSize: "16px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", gap: "8px",
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
                  marginBottom: "40px", padding: "14px 16px", borderRadius: "12px",
                  backgroundColor: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
                  fontSize: "13px", color: "#aaa", lineHeight: "1.6", maxWidth: "340px",
                }}
              >
                Tap the <strong style={{ color: "#f5a623" }}>Share</strong> button in Safari, then <strong style={{ color: "#f5a623" }}>"Add to Home Screen"</strong> to install Civiq.
              </motion.div>
            )}

            {/* FEED CARD */}
            <motion.div
              variants={fadeUp}
              className="feed-card"
              style={{ backgroundColor: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", maxWidth: "520px" }}
            >
              <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#f5a623", marginBottom: "18px" }}>
                Today in Ontario
              </div>
              {[
                { tag: "HOUSING", title: "Ford government cuts municipal review powers", time: "2h ago" },
                { tag: "EDUCATION", title: "Bill 212 passes third reading in legislature", time: "4h ago" },
                { tag: "BUDGET", title: "Province announces $3.2B infrastructure spend", time: "6h ago" },
              ].map((item, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? "14px" : 0, marginBottom: i < 2 ? "14px" : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "9px", fontWeight: "800", letterSpacing: "0.08em", color: "#f5a623", backgroundColor: "rgba(245,166,35,0.1)", padding: "2px 7px", borderRadius: "3px" }}>{item.tag}</span>
                    <span style={{ fontSize: "12px", color: "#444" }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#ccc", lineHeight: "1.45" }}>{item.title}</div>
                </div>
              ))}
              <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#444" }}>Your political position</span>
                <Link href="/sign-up" style={{ fontSize: "12px", fontWeight: "700", color: "#f5a623", textDecoration: "none" }}>Take the quiz →</Link>
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* STATS */}
        <div className="stat-row">
          {[
            { num: "60+", label: "Learning modules" },
            { num: "5 min", label: "To understand any issue" },
            { num: "0", label: "Political bias" },
          ].map((s, i) => (
            <motion.div key={s.label} className="stat-cell" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <div className="stat-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: "40px", fontWeight: "900", color: "#f5a623", letterSpacing: "-1px", lineHeight: "1", marginBottom: "6px" }}>{s.num}</div>
              <div style={{ fontSize: "12px", color: "#555", fontWeight: "500" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="section-pad" style={{ maxWidth: "1100px", margin: "0 auto", padding: "88px 48px" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: "10px" }}>What's inside</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: "900", letterSpacing: "-0.8px", color: "#f0ede6", lineHeight: "1.1" }}>
              Everything you need to get informed.
            </h2>
          </motion.div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {features.map((f, i) => (
              <motion.div key={f.title} className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5 }}>
                <div style={{ fontSize: "24px", marginBottom: "14px" }}>{f.icon}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#e8e6e0", marginBottom: "6px" }}>{f.title}</div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* QUOTE */}
        <div className="quote-section" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: "#111", padding: "80px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "52px", color: "#f5a623", lineHeight: "1", marginBottom: "14px" }}>"</div>
            <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: "700", color: "#ccc", lineHeight: "1.55", letterSpacing: "-0.3px", marginBottom: "20px" }}>
              What is the first part of politics? Education. The second? Education. And the third? Education.
            </blockquote>
            <cite style={{ fontSize: "11px", color: "#444", fontStyle: "normal", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase" }}>Jules Michelet</cite>
          </div>
        </div>

        {/* CCF STRIP */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: "#0d0d0d", padding: "22px 48px" }}>
          <div className="partner-inner" style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: "#444", textTransform: "uppercase", whiteSpace: "nowrap" }}>In partnership with</div>
              <a href="https://www.civicclarityfoundation.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", fontWeight: "700", color: "#e8e6e0", borderLeft: "2px solid #f5a623", paddingLeft: "12px", whiteSpace: "nowrap", textDecoration: "none" }}>
                Civic Clarity Foundation ↗
              </a>
            </div>
            <div style={{ fontSize: "13px", color: "#444", maxWidth: "460px", lineHeight: "1.65" }}>
              A non-partisan, youth-focused think tank committed to governmental transparency, accountability, and meaningful youth inclusion in democracy.
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="final-cta" style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 48px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: "900", letterSpacing: "-1.5px", color: "#f0ede6", marginBottom: "16px", lineHeight: "1.08" }}>
              Your province.<br />Your politics.<br />Your ground.
            </h2>
            <p style={{ fontSize: "16px", color: "#555", marginBottom: "40px", lineHeight: "1.75" }}>
              No algorithm. No outrage bait. Just the information you need to form your own view.
            </p>
            <Link href="/sign-up" className="cta-amber">Start for free</Link>
          </motion.div>
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px 48px", backgroundColor: "#0d0d0d" }}>
          <div className="footer-inner" style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontSize: "13px", color: "#2e2e2e" }}>Built by Shahmeer · Powered by Civic Clarity Foundation · Ontario, Canada</div>
            <div style={{ fontSize: "12px", color: "#2a2a2a" }}>© 2025 Civiq. All rights reserved.</div>
          </div>
        </footer>

      </div>
    </>
  );
}