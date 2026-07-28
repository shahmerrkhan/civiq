import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      gap: "32px",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "28px",
          fontWeight: "900",
          color: "#f0ede6",
          letterSpacing: "-0.5px",
        }}>Get informed.</h1>
      </div>
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <SignUp
          forceRedirectUrl="/onboarding"
          appearance={{
            elements: {
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
              header: { display: "none" },
              footer: { display: "none" },
              card: {
                backgroundColor: "#1e1e1e",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                width: "100%",
              },
              formFieldLabel: { color: "#aaa" },
              formFieldInput: {
                backgroundColor: "#242424",
                borderColor: "rgba(255,255,255,0.15)",
                color: "#f0ede6",
              },
              formFieldSuccessText: { color: "#4caf50" },
              formFieldHintText: { color: "#aaa" },
              formFieldErrorText: { color: "#ff6b6b" },
              otpCodeFieldInput: {
                backgroundColor: "#242424",
                borderColor: "rgba(255,255,255,0.2)",
                color: "#f0ede6",
                fontSize: "20px",
              },
              formResendCodeLink: { color: "#f5a623" },
              alternativeMethodsBlockButton: {
                backgroundColor: "#242424",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#ccc",
              },
              footerActionLink: { color: "#f5a623" },
              backLink: { color: "#aaa" },
              formFieldAction: { color: "#f5a623" },
              navbar: { display: "none" },
              navbarMobileMenuButton: { display: "none" },
              pageScrollBox: { backgroundColor: "#1e1e1e" },
              selectButton: {
                backgroundColor: "#242424",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#ccc",
              },
              formButtonPrimary: {
                backgroundColor: "#f5a623",
                color: "#0a0800",
                fontWeight: "700",
              },
              socialButtonsBlockButton: {
                backgroundColor: "#111",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#e8e6e0",
              },
              dividerLine: { backgroundColor: "rgba(255,255,255,0.08)" },
              dividerText: { color: "#444" },
              identityPreviewText: { color: "#e8e6e0" },
              identityPreviewEditButton: { color: "#f5a623" },
              footerPages: { color: "#aaa" },
              footerPagesLink: { color: "#888" },
              footerAction: { color: "#888" },
              badge: { color: "#aaa", backgroundColor: "#242424" },
              tagInputItem: { color: "#f0ede6" },
              formFieldInputShowPasswordButton: { color: "#888" },
              formFieldLabel__legalAccepted: {
                color: "#f0ede6 !important",
                fontSize: "13px",
              },
            },
          }}
        />
        <p style={{ fontSize: "14px", color: "#555" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#f5a623", textDecoration: "none", fontWeight: "600" }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}