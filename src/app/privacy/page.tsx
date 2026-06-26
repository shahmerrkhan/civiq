"use client";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const sections = [
  {
    title: "Who we are",
    content: "Civiq is operated by the Civic Clarity Foundation, a Canadian non-profit. We built Civiq to help young Ontarians understand and engage with civic issues. We are not a commercial product and we do not sell your data.",
  },
  {
    title: "What we collect",
    items: [
      "Your email address and username, provided when you sign up via Clerk",
      "Your political compass position, set during onboarding",
      "Content you create: opinions, debate messages, circle posts",
      "Actions you take: poll votes, forecast predictions, bookmarks, reactions, module completions",
      "Streak and XP data to track your civic engagement",
      "Push notification subscription tokens, if you opt in",
      "Authentication cookies set by Clerk",
    ],
  },
  {
    title: "How we use it",
    items: [
      "To show you personalized civic content and track your engagement",
      "To power features like Debate Rooms, Opinion Map, and Civic Forecast",
      "To send push notifications you have opted into",
      "To improve Civiq over time",
    ],
    note: "We do not use your data for advertising. We do not sell or share your data with third parties except as described below.",
  },
  {
    title: "Third parties",
    items: [
      "Clerk — handles authentication and stores your email and account info. See clerk.com/privacy.",
      "Neon — our database provider, hosted in the US. Data is encrypted at rest and in transit.",
      "Google Gemini — used to generate civic content. We do not send your personal information to Gemini.",
      "Vercel — our hosting provider. See vercel.com/legal/privacy-policy.",
      "Upstash — our caching and rate limiting provider. No personal data is stored there.",
    ],
  },
  {
    title: "Users under 18",
    content: "Civiq is designed for users aged 16 and older. We do not knowingly collect data from children under 13. If you believe a child under 13 has created an account, contact us at the email below and we will delete it promptly.",
  },
  {
    title: "Your rights",
    content: "Under PIPEDA and Quebec Law 25, you have the right to access, correct, or request deletion of your personal data. You can delete your account and all associated data directly from your Profile page. To request a manual deletion, email us and we will respond within 30 days.",
  },
  {
    title: "Data retention",
    content: "We keep your data as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.",
  },
  {
    title: "Contact",
    content: "Civic Clarity Foundation · rehan.mazid@gmail.com",
  },
];

export default function PrivacyPolicy() {
  return (
    <AppLayout active="">
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/dashboard" style={{ fontSize: "12px", color: "#444", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Legal</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" }}>Privacy Policy</h1>
          <p style={{ fontSize: "13px", color: "#444", marginBottom: "40px" }}>Last updated: June 2025</p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "24px 28px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                {section.title}
              </div>
              {section.content && (
                <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.8", margin: 0 }}>{section.content}</p>
              )}
              {section.items && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ display: "flex", gap: "10px", fontSize: "14px", color: "#888", lineHeight: "1.7" }}>
                      <span style={{ color: "#f5a623", flexShrink: 0, marginTop: "2px" }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.note && (
                <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.7", marginTop: "12px", marginBottom: 0 }}>{section.note}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}