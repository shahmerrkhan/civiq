"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, ClerkLoaded } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: "🏠" },
  { label: "Learn", href: "/learn", icon: "📚" },
  { label: "Polls", href: "/polls", icon: "🗳️" },
  { label: "Daily", href: "/daily", icon: "🎯" },
  { label: "Saved", href: "/bookmarks", icon: "🔖" },
  { label: "Opinions", href: "/opinions", icon: "🗒️" },
  { label: "Pulse", href: "/pulse", icon: "⚡" },
  { label: "About", href: "/about", icon: "🏛️" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export default function AppLayout({ children, active }: { children: React.ReactNode; active: string }) {
  const [isMobile, setIsMobile] = useState(false);
const [mounted, setMounted] = useState(false);
const [streak, setStreak] = useState(0);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768);
  check();
  setMounted(true);
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);

useEffect(() => {
  fetch("/api/streak")
    .then(r => r.json())
    .then(d => setStreak(d.streak || 0))
    .catch(() => {});
}, []);

if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .nav-link { transition: all 0.2s ease; }
        .nav-link:hover { color: #fff !important; background-color: rgba(255,255,255,0.05) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        backgroundColor: "#06060c",
        backgroundImage: `
          radial-gradient(ellipse at 20% 0%, rgba(245,166,35,0.04) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 100%, rgba(96,165,250,0.04) 0%, transparent 60%)
        `,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "'DM Sans', sans-serif",
        color: "#ffffff",
      }}>

        {!isMobile && (
          <div style={{
            width: "220px",
            minHeight: "100vh",
            backgroundColor: "rgba(255,255,255,0.015)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            padding: "28px 14px",
            position: "sticky",
            top: 0,
            height: "100vh",
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ marginBottom: "36px", paddingLeft: "8px" }}>
              <Logo size={0.6} />
            </div>

            <div style={{ flex: 1 }}>
              {NAV_ITEMS.map((item, i) => {
                const isActive = active === item.href;
                return (
                  <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link
                      href={item.href}
                      className="nav-link"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: isActive ? "600" : "500",
                        color: isActive ? "#ffffff" : "#444",
                        backgroundColor: isActive ? "rgba(245,166,35,0.1)" : "transparent",
                        textDecoration: "none",
                        marginBottom: "2px",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          style={{
                            position: "absolute", inset: 0,
                            backgroundColor: "rgba(245,166,35,0.1)",
                            borderRadius: "10px",
                            border: "1px solid rgba(245,166,35,0.15)",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span style={{ position: "relative", fontSize: "15px" }}>{item.icon}</span>
                      <span style={{ position: "relative" }}>{item.label}</span>
                      {isActive && (
                        <div style={{
                          position: "absolute", right: "12px",
                          width: "5px", height: "5px",
                          borderRadius: "50%",
                          backgroundColor: "#f5a623",
                        }} />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div style={{
              paddingLeft: "12px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}>
              {streak > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 12px", borderRadius: "10px",
                  backgroundColor: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.15)",
                  marginBottom: "14px",
                }}>
                  <span style={{ fontSize: "16px" }}>🔥</span>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#f5a623", lineHeight: "1" }}>{streak}</div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>day streak</div>
                  </div>
                </div>
              )}
              <ClerkLoaded>
                <UserButton />
              </ClerkLoaded>
            </div>
          </div>
        )}

        <div style={{
          flex: 1,
          minWidth: 0,
          paddingBottom: isMobile ? "72px" : "0",
          overflowY: "auto",
          animation: "fadeIn 0.3s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {isMobile && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              gap: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              backgroundColor: "rgba(6,6,12,0.85)",
              position: "sticky",
              top: 0,
              zIndex: 10,
              backdropFilter: "blur(20px)",
            }}>
              <Logo size={0.5} />
              <ClerkLoaded>
                <UserButton />
              </ClerkLoaded>
            </div>
          )}

          <div style={{
            width: "100%",
            maxWidth: "860px",
            padding: isMobile ? "20px 16px" : "0",
          }}>
            {children}
          </div>
        </div>

        {isMobile && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              height: "68px",
              backgroundColor: "rgba(6,6,12,0.92)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              backdropFilter: "blur(20px)",
              zIndex: 50,
              paddingBottom: "4px",
            }}
          >
              {NAV_ITEMS.filter(item => !["Pulse", "Saved", "Opinions", "About"].includes(item.label)).map(item => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "10px",
                    fontWeight: "600",
                    color: isActive ? "#f5a623" : "#333",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    padding: "6px 12px",
                    position: "relative",
                    minWidth: "52px",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveNav"
                      style={{
                        position: "absolute",
                        top: 0, left: "50%",
                        transform: "translateX(-50%)",
                        width: "24px", height: "2px",
                        borderRadius: "0 0 4px 4px",
                        backgroundColor: "#f5a623",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}