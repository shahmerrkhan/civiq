"use client";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const PILLARS = [
  {
    icon: "⚖️",
    label: "Non-partisan",
    description: "Every perspective shown — left, centre, right. CCF was built on this principle and Civiq inherits it. We never take sides.",
  },
  {
    icon: "🎓",
    label: "Youth-first",
    description: "Designed for 16–25 year olds. Not simplified — accessible. CCF has already proven youth can influence policy at the national level.",
  },
  {
    icon: "🔍",
    label: "Transparent",
    description: "Sources cited, perspectives labelled, no hidden agenda. Governmental transparency is the foundation CCF was built on.",
  },
];

const CCF_LINKS = [
  { label: "Mission", href: "https://www.civicclarityfoundation.org/mission" },
  { label: "Leadership", href: "https://www.civicclarityfoundation.org/leadership" },
  { label: "Policy & Advocacy", href: "https://www.civicclarityfoundation.org/policy" },
  { label: "Join CCF", href: "https://www.civicclarityfoundation.org/jointheccf" },
  { label: "Donate", href: "https://www.civicclarityfoundation.org/donate" },
];

export default function AboutClient({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <AppLayout active="/about">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .ccf-link:hover { background-color: rgba(245,166,35,0.12) !important; color: #f5a623 !important; border-color: rgba(245,166,35,0.3) !important; }
        .pillar-card:hover { background-color: rgba(255,255,255,0.04) !important; }
        .cta-secondary:hover { border-color: rgba(255,255,255,0.15) !important; color: #aaa !important; }
      `}</style>

      <div style={{ padding: "48px 24px 100px", maxWidth: "820px", width: "100%", margin: "0 auto", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>

        {/* Badge */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={0} style={{ marginBottom: "28px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: "100px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: "#f5a623", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            🏛️ A Civic Clarity Foundation Initiative
          </span>
        </motion.div>

        {/* Hero */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={1} style={{ marginBottom: "52px" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "800", letterSpacing: "-2px", lineHeight: "1.05", marginBottom: "20px" }}>
            Civiq is{" "}
            <span style={{ background: "linear-gradient(135deg, #f5a623 0%, #ffcc70 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CCF&apos;s product
            </span>
            {" "}for the generation that actually matters.
          </h1>
          <p style={{ fontSize: "17px", color: "#555", lineHeight: "1.75", maxWidth: "600px" }}>
            The Civic Clarity Foundation is a non-partisan, youth-focused think tank working to embed transparency,
            accountability, and meaningful youth inclusion into Canadian democracy. Civiq is how they put that mission in your pocket.
          </p>
        </motion.div>

        {/* Quote */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={2} style={{ marginBottom: "40px" }}>
          <div style={{ borderLeft: "2px solid #f5a623", paddingLeft: "24px" }}>
            <p style={{ fontSize: "18px", fontWeight: "600", lineHeight: "1.6", color: "#aaa", letterSpacing: "-0.3px", marginBottom: "10px" }}>
              &quot;What is the first part of politics? Education. The second? Education. And the third? Education.&quot;
            </p>
            <p style={{ fontSize: "13px", color: "#444", fontWeight: "600" }}>Jules Michelet — CCF&apos;s founding ethos</p>
          </div>
        </motion.div>

        {/* CCF Card */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={3} style={{ marginBottom: "20px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.02) 100%)", border: "1px solid rgba(245,166,35,0.14)", borderRadius: "22px", padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap", marginBottom: "24px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "14px", backgroundColor: "rgba(245,166,35,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
                🏛️
              </div>
              <div>
                <div style={{ fontSize: "21px", fontWeight: "800", letterSpacing: "-0.5px", marginBottom: "4px" }}>Civic Clarity Foundation</div>
                <div style={{ fontSize: "13px", color: "#f5a623", fontWeight: "600" }}>Non-Profit · National Organization · civicclarityfoundation.org</div>
              </div>
            </div>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.8", marginBottom: "16px" }}>
              CCF operates on the belief that democracy&apos;s strength is measured by its commitment to governmental
              transparency, accountability, and the meaningful inclusion of all stakeholders — including youth.
              They&apos;ve already taken that mission to the national stage: hosting a cross-partisan panel on Youth Mental
              Health and the Role of Good Governance, and submitting a brief to the Standing Senate Committee on Social Affairs on Bill S-212.
            </p>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.8", marginBottom: "28px" }}>
              Civiq is CCF&apos;s flagship civic technology initiative. CCF is the institution — the credibility,
              the government relationships, the mission. Civiq is the tool that makes all of it tangible for the
              16-year-old who has never once thought about how a bill becomes law.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CCF_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="ccf-link" style={{ display: "inline-flex", alignItems: "center", padding: "7px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.07)", fontSize: "13px", fontWeight: "600", color: "#666", textDecoration: "none", transition: "all 0.2s ease" }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* The Relationship */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={4} style={{ marginBottom: "20px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "22px", padding: "32px" }}>
            <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>
              How they work together
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center" }}>
              <div style={{ backgroundColor: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.12)", borderRadius: "14px", padding: "22px" }}>
                <div style={{ fontSize: "22px", marginBottom: "10px" }}>🏛️</div>
                <div style={{ fontSize: "15px", fontWeight: "800", marginBottom: "6px", letterSpacing: "-0.3px" }}>CCF</div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
                  The institution. Credibility, government partnerships, national advocacy, and content integrity oversight. CCF ensures Civiq stays genuinely non-partisan.
                </div>
              </div>
              <div style={{ fontSize: "18px", color: "#333", textAlign: "center" as const, padding: "0 4px" }}>|</div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "22px" }}>
                <div style={{ fontSize: "22px", marginBottom: "10px" }}>📱</div>
                <div style={{ fontSize: "15px", fontWeight: "800", marginBottom: "6px", letterSpacing: "-0.3px" }}>Civiq</div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
                  The product. CCF&apos;s mission made tangible — a platform Gen Z can actually open, use, and learn from.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Why it exists */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={5} style={{ marginBottom: "20px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "22px", padding: "32px" }}>
            <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>
              Why this exists
            </div>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.8", marginBottom: "14px" }}>
              The attention cycle is broken. Something blows up — a scandal, a new budget, a housing bill — it dominates
              the feed for two weeks, then disappears. Nothing changes because no one followed through.
            </p>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.8", marginBottom: "14px" }}>
              The source problem makes it worse. Most Gen Z forms political opinions off a 60-second TikTok — no context,
              no history, no nuance. Strong takes with no foundation.
            </p>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.8" }}>
              Ontario&apos;s provincial politics affects your daily life more than anything in Washington ever will —
              healthcare, transit, education, housing. But it gets a fraction of the attention. Civiq fixes that.
            </p>
          </div>
        </motion.div>

        {/* Three pillars */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={6} style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", color: "#444", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>
            Built on three principles
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {PILLARS.map((item, i) => (
              <motion.div key={item.label} variants={FADE_UP} initial="hidden" animate="show" custom={6.5 + i * 0.3} className="pillar-card" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", transition: "background-color 0.2s ease" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
                <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-0.2px" }}>{item.label}</div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>{item.description}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={FADE_UP} initial="hidden" animate="show" custom={8} style={{ textAlign: "center", padding: "48px 24px", backgroundColor: "rgba(245,166,35,0.03)", border: "1px solid rgba(245,166,35,0.08)", borderRadius: "22px" }}>
          <div style={{ fontSize: "13px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>
            Know your ground.
          </div>
          <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>
            Politics affects your life whether you follow it or not.
          </div>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "32px" }}>
            Civiq is free. Non-partisan. Built for you.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {!isSignedIn ? (
              <>
                <Link href="/sign-up" style={{ backgroundColor: "#f5a623", color: "#000", padding: "13px 28px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                  Get started
                </Link>
                <a href="https://www.civicclarityfoundation.org" target="_blank" rel="noopener noreferrer" className="cta-secondary" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#666", padding: "13px 28px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", textDecoration: "none", transition: "all 0.2s ease" }}>
                  Visit CCF
                </a>
              </>
            ) : (
              <Link href="/dashboard" style={{ backgroundColor: "#f5a623", color: "#000", padding: "13px 28px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
                Back to feed
              </Link>
            )}
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
}