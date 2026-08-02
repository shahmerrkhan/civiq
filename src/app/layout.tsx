import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Nonce-based CSP requires dynamic rendering: Next.js injects the per-request
// nonce during SSR, so a page prerendered at build time would ship script tags
// with no nonce and be blocked by 'strict-dynamic'. Applied at the root so it
// also covers the "use client" pages, which cannot export route config
// themselves (/contact, /donate, /faq, /learn, /onboarding).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Civiq",
  description: "Your civic IQ, levelled up.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Civiq",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5a623",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <ClerkProvider
  // `dynamic` swaps Clerk's build-time script tag for DynamicClerkScripts,
  // which reads the per-request X-Nonce header and stamps the nonce onto the
  // clerk-js <script>. Without it that script carries no nonce and
  // 'strict-dynamic' blocks it, breaking sign-in entirely.
  dynamic
  localization={{
    unstable__errors: {
      form_password_pwned: "This password has shown up in a known data breach. Pick something unique to you and try again.",
    },
  }}
>
      <html lang="en" data-scroll-behavior="smooth">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f5a623" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Civiq" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </head>
        <body>{children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
