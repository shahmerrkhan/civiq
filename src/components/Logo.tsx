"use client";
import { useRouter } from "next/navigation";

export default function Logo({ size = 1, href = "/dashboard" }: { size?: number; href?: string }) {
  const router = useRouter();
  const s = size;

  return (
    <div
      onClick={() => router.push(href)}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: `${6 * s}px`, userSelect: "none" }}
    >
      <svg width={36 * s} height={36 * s} viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#f5a623"/>
        <path
          d="M19 8H13C10.2 8 8 10.2 8 13V15C8 17.8 10.2 20 13 20H19"
          stroke="#0a0800"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span style={{
        fontSize: `${24 * s}px`,
        fontWeight: "700",
        letterSpacing: "-0.5px",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1,
        color: "#f0ede6",
      }}>
        Civiq
      </span>
    </div>
  );
}
