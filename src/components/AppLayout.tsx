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
  { label: "Swipe", href: "/daily", icon: "⚡" },
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifPrompt, setNotifPrompt] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "default") {
      setTimeout(() => setNotifPrompt(true), 5000);
    }
  }, [isMobile]);

  const enableNotifications = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setNotifPrompt(false); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setNotifPrompt(false);
    } catch (e) {
      setNotifPrompt(false);
    }
  };
  
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
        .nav-link:hover { color: #aaa !important; background-color: rgba(255,255,255,0.05) !important; }
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

        {/* DESKTOP SIDEBAR */}
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

            <div style={{ flex: 1, overflowY: "auto" }}>
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
                        color: isActive ? "#ffffff" : "#777",
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
                    <div style={{ fontSize: "10px", color: "#777", marginTop: "2px" }}>day streak</div>
                  </div>
                </div>
              )}
              <ClerkLoaded>
                <UserButton />
              </ClerkLoaded>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
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
          {/* MOBILE TOP HEADER */}
          {isMobile && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              width: "100%",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              backgroundColor: "rgba(6,6,12,0.85)",
              position: "sticky",
              top: 0,
              zIndex: 10,
              backdropFilter: "blur(20px)",
            }}>
              <Logo size={0.5} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {streak > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 10px", borderRadius: "8px",
                    backgroundColor: "rgba(245,166,35,0.08)",
                    border: "1px solid rgba(245,166,35,0.15)",
                  }}>
                    <span style={{ fontSize: "14px" }}>🔥</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#f5a623" }}>{streak}</span>
                  </div>
                )}
                <ClerkLoaded>
                  <UserButton />
                </ClerkLoaded>
              </div>
            </div>
          )}

          <div style={{
            width: "100%",
            maxWidth: "860px",
            padding: isMobile ? "20px 16px" : "32px 24px",
          }}>
            {children}
          </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
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
              {NAV_ITEMS.filter(item => !["Pulse", "Saved", "Opinions", "About", "Profile", "Daily"].includes(item.label)).map(item => {
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
                    color: isActive ? "#f5a623" : "#555",
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
                        top: "-1px", left: "50%",
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
            <button
              onClick={() => setDrawerOpen(o => !o)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "3px", fontSize: "10px", fontWeight: "600",
                color: drawerOpen ? "#f5a623" : "#555",
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 12px", minWidth: "52px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: "18px" }}>☰</span>
              <span>More</span>
            </button>
          </motion.div>
        )}

        {/* MOBILE MORE DRAWER */}
        {isMobile && (
          <AnimatePresence>
            {drawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    position: "fixed", bottom: "68px", left: 0, right: 0,
                    backgroundColor: "#0f0f18",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px 20px 0 0",
                    padding: "20px 16px",
                    zIndex: 50,
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px", paddingLeft: "4px" }}>More</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {NAV_ITEMS.filter(item => ["Pulse", "Saved", "Opinions", "About", "Profile"].includes(item.label)).map(item => {
                      const isActive = active === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "12px 14px", borderRadius: "12px",
                            fontSize: "14px", fontWeight: "600",
                            color: isActive ? "#f5a623" : "#888",
                            backgroundColor: isActive ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.03)",
                            border: isActive ? "1px solid rgba(245,166,35,0.2)" : "1px solid rgba(255,255,255,0.05)",
                            textDecoration: "none",
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
</div>

      {isMobile && notifPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: "fixed", bottom: "80px", left: "16px", right: "16px",
            backgroundColor: "#0f0f18",
            border: "1px solid rgba(245,166,35,0.25)",
            borderRadius: "16px", padding: "16px 18px",
            zIndex: 60, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede6", marginBottom: "2px" }}>
              🔔 Stay in the loop
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              Get notified when new Ontario stories drop
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => setNotifPrompt(false)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#444", fontFamily: "'DM Sans', sans-serif" }}
            >
              Not now
            </button>
            <button
              onClick={enableNotifications}
              style={{
                backgroundColor: "#f5a623", color: "#000",
                border: "none", borderRadius: "8px",
                padding: "7px 14px", fontSize: "12px",
                fontWeight: "700", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}