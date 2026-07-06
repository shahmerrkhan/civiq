"use client";
import AppLayout from "@/components/AppLayout";

export default function DonatePage() {
  return (
    <AppLayout active="/donate">
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          maxWidth: 420,
          width: "100%",
          backgroundColor: "#0d0d18",
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: 20,
          padding: "48px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(245,166,35,0.08)",
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ fontSize: 40, marginBottom: 16 }}>💛</div>

          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#444",
            marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
          }}>
            Civiq · Support
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 30, fontWeight: 900, color: "#f5a623",
            letterSpacing: "-0.5px", marginBottom: 16,
          }}>
            Donations coming soon
          </h1>

          <p style={{
            fontSize: 14, color: "#666", lineHeight: 1.7,
            fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
          }}>
            We're setting up a way for you to support Civiq directly. Check back soon.
          </p>

          <div style={{
            height: 1,
            background: "linear-gradient(90deg, rgba(245,166,35,0.3), transparent)",
            margin: "24px 0",
          }} />

          <p style={{
            fontSize: 12, color: "#444",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Ontario, Canada · Civic Clarity Foundation
          </p>
        </div>
      </div>
    </AppLayout>
  );
}