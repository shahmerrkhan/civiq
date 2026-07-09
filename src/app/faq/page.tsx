"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const FAQS = [
  { q: "What is Civiq?", a: "Civiq is a civic engagement platform for Ontarians — a swipeable feed of civic news, forecasts, debate rooms, and tools to help you stay informed and involved." },
  { q: "Is Civiq free?", a: "Yes, completely free. Donations help keep it that way." },
  { q: "How is Civiq funded?", a: "Civiq is run by volunteers through the Civic Clarity Foundation, supported by donations from users." },
  { q: "Is my data safe?", a: "We only collect what's needed to run the app. You can delete your account and data anytime from settings." },
  { q: "How does the streak system work?", a: "You build a streak by engaging with the app daily — reading cards, voting, or completing challenges. Miss a day and it resets." },
  { q: "What are Debate Rooms?", a: "A space to practice steelmanning opposing views before making your own argument, matched with someone from a different political leaning." },
  { q: "What is Civic Forecast?", a: "A prediction feature where you forecast the outcome of real civic and political events, and earn points as they resolve." },
  { q: "I found a bug. What do I do?", a: "Head to the Contact page and select 'Bug report' — we read every submission." },
  { q: "Can I suggest a feature?", a: "Yes, please. Use the Contact page and select 'Idea / suggestion'." },
  { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. This is permanent and removes your data." },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <AppLayout active="/faq">
      <div style={{ minHeight: "100vh", padding: "48px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#444", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", textAlign: "center",
            }}
          >
            Civiq · Help
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900,
              color: "#f5a623", textAlign: "center", marginBottom: 40,
            }}
          >
            Frequently Asked Questions
          </motion.h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    backgroundColor: "#0d0d18",
                    border: isOpen ? "1px solid rgba(245,166,35,0.35)" : "1px solid rgba(245,166,35,0.15)",
                    borderRadius: 14, padding: "16px 20px", cursor: "pointer",
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#eee",
                  }}>
                    {item.q}
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: "#f5a623", fontSize: 13, marginLeft: 12 }}
                    >
                      ▶
                    </motion.span>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{
                          marginTop: 12, fontSize: 14, color: "#888", lineHeight: 1.7,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: "center", marginTop: 32, fontSize: 13, color: "#555",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Still stuck? <a href="/contact" style={{ color: "#f5a623" }}>Contact us</a>.
          </motion.p>
        </div>
      </div>
    </AppLayout>
  );
}