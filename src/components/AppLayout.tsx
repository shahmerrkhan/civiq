"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, ClerkLoaded } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { Home, Target, BookOpen, Vote, Zap, Circle, MessageSquare, Map, ScrollText, TrendingUp, Landmark, Bookmark, MessageCircle, Heart, HelpCircle, Mail, User, Hourglass, Flame, Bell, Menu } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Challenges", href: "/challenges", icon: Target, tour: "challenges" },
  { label: "Learn", href: "/learn", icon: BookOpen, tour: "learn" },
  { label: "Polls", href: "/polls", icon: Vote },
  { label: "Swipe", href: "/daily", icon: Zap },
  { label: "Circles", href: "/circles", icon: Circle },
  { label: "Debate", href: "/debate", icon: MessageSquare, tour: "debate" },
  { label: "Map", href: "/map", icon: Map },
  { href: "/storylines", icon: ScrollText, label: "Stories", tour: "storylines" },
  { label: "Forecast", href: "/forecast", icon: TrendingUp },
  { label: "Witness", href: "/witness", icon: Hourglass },
  { label: "My Ontario", href: "/ontario", icon: Landmark },
  { label: "Saved", href: "/bookmarks", icon: Bookmark },
  { label: "Opinions", href: "/opinions", icon: MessageCircle },
  { label: "Pulse", href: "/pulse", icon: Zap },
  { label: "About", href: "/about", icon: Landmark },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Donate", href: "/donate", icon: Heart },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function AppLayout({ children, active }: { children: React.ReactNode; active: string }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifPrompt, setNotifPrompt] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;

    const dismissed = localStorage.getItem("civiq_notif_dismissed");
    if (dismissed && Date.now() < Number(dismissed)) return;

    // track first seen
    if (!localStorage.getItem("civiq_first_seen")) {
      localStorage.setItem("civiq_first_seen", String(Date.now()));
    }
    const firstSeen = Number(localStorage.getItem("civiq_first_seen"));
    const isReturningUser = Date.now() - firstSeen > 1000 * 60 * 60 * 24; // been here over a day

    // returning users who haven't subscribed get prompted faster
    const delay = isReturningUser ? 3000 : 15000;
    const timer = setTimeout(() => setNotifPrompt(true), delay);
    return () => clearTimeout(timer);
  }, [mounted]);

  const enableNotifications = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setNotifPrompt(false); return; }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        alert("VAPID key missing — check Vercel env vars");
        setNotifPrompt(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });
      localStorage.setItem("civiq_notif_dismissed", "false");
      setNotifPrompt(false);
    } catch {
      setNotifPrompt(false);
    }
  };
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/streak", { method: "POST" })
      .then(r => r.json())
      .then(d => setStreak(d.streak || 0))
      .catch(() => {});
  }, []);

    const [showLoader, setShowLoader] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("civiq_loaded") !== "true";
  });

  useEffect(() => {
    if (!showLoader) return;
    const min = setTimeout(() => {
      sessionStorage.setItem("civiq_loaded", "true");
      setShowLoader(false);
    }, 2500);
    return () => clearTimeout(min);
  }, [showLoader]);

  if (showLoader) return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#06060c",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&family=Playfair+Display:wght@900&display=swap');
        @keyframes civiq-orb1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.6} 50%{transform:translate(40px,-30px) scale(1.15);opacity:.3} }
        @keyframes civiq-orb2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.4} 50%{transform:translate(-30px,40px) scale(1.1);opacity:.7} }
        @keyframes civiq-scan { 0%{transform:translateY(-100%);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateY(200px);opacity:0} }
        @keyframes civiq-bar { 0%{width:0%;opacity:1} 60%{width:75%;opacity:1} 85%{width:92%;opacity:1} 100%{width:100%;opacity:0} }
        @keyframes civiq-word { 0%{opacity:0;transform:translateY(8px);filter:blur(4px)} 100%{opacity:1;transform:translateY(0);filter:blur(0)} }
        @keyframes civiq-pulse-ring { 0%{transform:scale(0.8);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
        @keyframes civiq-dot { 0%,100%{opacity:.2} 50%{opacity:1} }
      `}</style>

      <div style={{ position:"absolute", width:"600px", height:"600px", borderRadius:"50%", top:"-150px", left:"-150px", background:"radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)", animation:"civiq-orb1 12s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", bottom:"-100px", right:"-100px", background:"radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)", animation:"civiq-orb2 16s ease-in-out infinite", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{ position:"relative", marginBottom:"32px" }}>
          <div style={{ position:"absolute", inset:"-20px", borderRadius:"50%", border:"1px solid rgba(245,166,35,0.15)", animation:"civiq-pulse-ring 2s ease-out infinite" }} />
          <div style={{ position:"absolute", inset:"-20px", borderRadius:"50%", border:"1px solid rgba(245,166,35,0.1)", animation:"civiq-pulse-ring 2s ease-out 0.6s infinite" }} />
          <div style={{ width:"72px", height:"72px", borderRadius:"20px", background:"linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.05) 100%)", border:"1px solid rgba(245,166,35,0.25)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", backdropFilter:"blur(10px)" }}>
            <div style={{ position:"absolute", left:0, right:0, height:"2px", background:"linear-gradient(90deg, transparent, rgba(245,166,35,0.8), transparent)", animation:"civiq-scan 2s ease-in-out infinite" }} />
            <span style={{ fontFamily:"'Playfair Display', serif", fontSize:"40px", fontWeight:"900", color:"#f5a623", lineHeight:1, position:"relative", zIndex:1 }}>Q</span>
          </div>
        </div>

        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:"42px", fontWeight:"900", letterSpacing:"-2px", color:"#f0ede6", marginBottom:"10px", animation:"civiq-word 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
          Civiq
        </div>
        <div style={{ fontSize:"11px", fontWeight:"700", letterSpacing:"0.16em", textTransform:"uppercase", color:"#f5a623", opacity:0, animation:"civiq-word 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards", marginBottom:"48px" }}>
          Ontario Civic Platform
        </div>

        <div style={{ width:"160px", height:"2px", backgroundColor:"rgba(255,255,255,0.05)", borderRadius:"10px", overflow:"hidden", marginBottom:"16px" }}>
          <div style={{ height:"100%", backgroundColor:"#f5a623", borderRadius:"10px", animation:"civiq-bar 4.5s cubic-bezier(0.4,0,0.2,1) both", boxShadow:"0 0 8px rgba(245,166,35,0.6)" }} />
        </div>

        <div style={{ display:"flex", gap:"6px" }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <div key={i} style={{ width:"4px", height:"4px", borderRadius:"50%", backgroundColor:"#f5a623", animation:`civiq-dot 1.2s ease-in-out ${delay}s infinite` }} />
          ))}
        </div>
      </div>

      <div style={{ position:"absolute", bottom:"32px", fontSize:"10px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", color:"#222", zIndex:2 }}>
        Powered by Civic Clarity Foundation
      </div>
    </div>
  );
  
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .nav-link { transition: color 0.15s ease, background-color 0.15s ease; will-change: color, background-color; }
        .nav-link:hover { color: #aaa !important; background-color: rgba(255,255,255,0.05) !important; }
        * { -webkit-tap-highlight-color: transparent; }
        button, a { touch-action: manipulation; }
        html, body { overscroll-behavior-y: none; }
        input, textarea, select { font-size: 16px; }
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
                  <div key={item.label}>
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
                        color: isActive ? "#ffffff" : "#888",
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
                      <span style={{ position: "relative" }}><item.icon size={15} /></span>
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
                  </div>
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
                  <Flame size={16} color="#f5a623" />
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#f5a623", lineHeight: "1" }}>{streak}</div>
                    <div style={{ fontSize: "10px", color: "#777", marginTop: "2px" }}>day streak</div>
                  </div>
                </div>
              )}
              {mounted && <ClerkLoaded>
                <UserButton appearance={{ variables: { colorBackground: "#1a1a24", colorForeground: "#e8e6e0", colorMutedForeground: "#999", colorInput: "#242430", colorInputForeground: "#e8e6e0", colorNeutral: "#888" }, elements: { userButtonPopoverCard: { backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }, userButtonPopoverActionButton: { color: "#ccc" }, userButtonPopoverActionButtonText: { color: "#ccc" }, userButtonPopoverActionButtonIcon: { color: "#888" }, userButtonPopoverFooter: { display: "none" } } }} />
              </ClerkLoaded>}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={{
          flex: 1,
          minWidth: 0,
          paddingBottom: isMobile ? "72px" : "0",
          overflowY: "auto",
          overflowX: "hidden",
          animation: "fadeIn 0.3s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          WebkitOverflowScrolling: "touch",
          transform: "translateZ(0)",
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
                    <Flame size={14} color="#f5a623" />
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#f5a623" }}>{streak}</span>
                  </div>
                )}
                {mounted && <ClerkLoaded>
                <UserButton appearance={{ variables: { colorBackground: "#1a1a24", colorForeground: "#e8e6e0", colorMutedForeground: "#999", colorInput: "#242430", colorInputForeground: "#e8e6e0", colorNeutral: "#888" }, elements: { userButtonPopoverCard: { backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }, userButtonPopoverActionButton: { color: "#ccc" }, userButtonPopoverActionButtonText: { color: "#ccc" }, userButtonPopoverActionButtonIcon: { color: "#888" }, userButtonPopoverFooter: { display: "none" } } }} />
                </ClerkLoaded>}
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
          <div
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              height: "68px",
              backgroundColor: "rgba(6,6,12,0.95)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              backdropFilter: "blur(20px)",
              zIndex: 50,
              paddingBottom: "4px",
            }}
          >
              {NAV_ITEMS.filter(item => !["Pulse", "Saved", "Opinions", "About", "Profile", "Daily", "Map", "Stories", "Challenges", "Learn", "Forecast", "Witness", "My Ontario", "Donate", "FAQ", "Contact"].includes(item.label)).map(item => {
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
                    overflow: "visible",
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveNav"
                      style={{
                        width: "24px", height: "2px",
                        borderRadius: "2px",
                        backgroundColor: "#f5a623",
                        marginTop: "2px",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
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
              <Menu size={18} />
              <span>More</span>
            </button>
          </div>
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
                    {NAV_ITEMS.filter(item => ["Challenges", "Learn", "Map", "Stories", "Forecast", "Witness", "My Ontario", "Pulse", "Saved", "Opinions", "About", "Profile", "Donate", "FAQ", "Contact"].includes(item.label)).map(item => {
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
                          <item.icon size={18} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "16px", paddingLeft: "4px" }}>
                    <a href="/privacy" style={{ fontSize: "11px", color: "#444", textDecoration: "none" }}>Privacy Policy</a>
                    <a href="/terms" style={{ fontSize: "11px", color: "#444", textDecoration: "none" }}>Terms of Service</a>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
      </div>

      {notifPrompt && (
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
<span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Bell size={14} />Get your Ontario brief</span>
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Morning + evening updates. 2 minutes a day.
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
          onClick={() => {
        setNotifPrompt(false);
        localStorage.setItem("civiq_notif_dismissed", String(Date.now() + 1000 * 60 * 60 * 24 * 3));
      }}
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


