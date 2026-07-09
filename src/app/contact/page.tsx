"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, category, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <AppLayout active="/contact">
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          maxWidth: 480, width: "100%", backgroundColor: "#0d0d18",
          border: "1px solid rgba(245,166,35,0.2)", borderRadius: 20,
          padding: "48px 32px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "#444", marginBottom: 20, fontFamily: "'DM Sans', sans-serif", textAlign: "center",
          }}>
            Civiq · Contact
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900,
            color: "#f5a623", textAlign: "center", marginBottom: 8,
          }}>
            Get in touch
          </h1>

          <p style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 28, fontFamily: "'DM Sans', sans-serif" }}>
            Bugs, ideas, questions, complaints — send it our way.
          </p>

          {status === "sent" ? (
            <p style={{ color: "#f5a623", textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
              Got it. Thanks for reaching out.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(245,166,35,0.2)",
                  backgroundColor: "#15151f", color: "#eee", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                }}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(245,166,35,0.2)",
                  backgroundColor: "#15151f", color: "#eee", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  colorScheme: "dark",
                }}
              >
                <option value="general">General</option>
                <option value="bug">Bug report</option>
                <option value="idea">Idea / suggestion</option>
                <option value="support">Support</option>
              </select>

              <textarea
                required
                minLength={5}
                maxLength={2000}
                placeholder="What's up?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(245,166,35,0.2)",
                  backgroundColor: "#15151f", color: "#eee", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  resize: "vertical",
                }}
              />

              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  padding: "14px 24px", backgroundColor: "#f5a623", color: "#0d0d18",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 15,
                  borderRadius: 12, border: "none", cursor: "pointer",
                }}
              >
                {status === "sending" ? "Sending..." : "Send"}
              </button>

              {status === "error" && (
                <p style={{ color: "#e05555", fontSize: 13, textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
                  Something went wrong. Try again.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}