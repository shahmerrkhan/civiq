"use client";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

const sections = [
  {
    title: "Acceptance",
    content: "By using Civiq, you agree to these terms. If you do not agree, do not use Civiq.",
  },
  {
    title: "Eligibility",
    content: "You must be at least 13 years old to use Civiq. Civiq is intended for users aged 16–25 in Ontario, Canada.",
  },
  {
    title: "Your content",
    content: "You own the opinions, posts, and content you create on Civiq. By posting, you grant the Civic Clarity Foundation a non-exclusive license to display that content within the platform. You are responsible for what you post. Do not post content that is hateful, misleading, or harmful.",
  },
  {
    title: "Prohibited conduct",
    items: [
      "Attempting to abuse, spam, or attack the platform",
      "Creating fake accounts or impersonating others",
      "Scraping or automated access without permission",
      "Posting content designed to mislead or manipulate civic discourse",
    ],
  },
  {
    title: "Termination",
    content: "We may suspend or terminate accounts that violate these terms, at our discretion.",
  },
  {
    title: "Disclaimer",
    content: "Civiq provides civic information for educational purposes. It is not legal or political advice. AI-generated content may contain errors. We are not liable for decisions made based on content on the platform.",
  },
  {
    title: "Changes",
    content: "We may update these terms. Continued use of Civiq after changes means you accept the new terms.",
  },
  {
    title: "Governing law",
    content: "These terms are governed by the laws of Ontario, Canada.",
  },
  {
    title: "Contact",
    content: "Civic Clarity Foundation · rehan.mazid@gmail.com",
  },
];

export default function Terms() {
  return (
    <AppLayout>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/dashboard" style={{ fontSize: "12px", color: "#444", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Back</Link>
          <div style={{ fontSize: "11px", color: "#f5a623", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Legal</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" }}>Terms of Service</h1>
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
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}