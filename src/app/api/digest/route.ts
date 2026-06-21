import { Resend } from "resend";
import { sql } from "@/db";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await sql`SELECT email FROM users WHERE email != ''`;
    
const recentCards = await sql`
      SELECT title, summary, category, perspectives
      FROM content_cards
      WHERE approved = true
      ORDER BY published_at DESC
      LIMIT 3
    `;

    if (!recentCards.length) return NextResponse.json({ error: "No feed content" }, { status: 404 });

    const top3 = recentCards;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; padding: 0; background-color: #06060c; font-family: 'DM Sans', -apple-system, sans-serif; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
          .header { margin-bottom: 36px; }
          .logo { font-size: 22px; font-weight: 800; color: #f5a623; letter-spacing: -0.5px; }
          .logo span { color: #ffffff; }
          .tagline { font-size: 13px; color: #444; margin-top: 4px; }
          .week-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #444; margin-bottom: 24px; }
          .card { background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; }
          .category { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; margin-bottom: 12px; }
          .card-title { font-size: 17px; font-weight: 700; color: #ffffff; line-height: 1.4; letter-spacing: -0.2px; margin-bottom: 10px; }
          .card-summary { font-size: 14px; color: #666; line-height: 1.7; margin-bottom: 14px; }
          .perspective { font-size: 13px; color: #555; line-height: 1.65; font-style: italic; padding: 10px 14px; border-left: 2px solid rgba(255,255,255,0.08); margin-bottom: 4px; }
          .cta { display: inline-block; background-color: #f5a623; color: #000000; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin-top: 32px; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #2a2a2a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Civi<span>q</span></div>
            <div class="tagline">Ontario politics, no spin</div>
          </div>

          <div class="week-label">This week in Ontario</div>

          ${top3.map((card: any) => {
            const categoryColors: Record<string, string> = {
              Infrastructure: "#60a5fa",
              Economy: "#4ade80",
              Education: "#f59e0b",
              Housing: "#a78bfa",
              Healthcare: "#f87171",
              Environment: "#34d399",
            };
            const color = categoryColors[card.category] || "#f5a623";
            return `
            <div class="card">
              <span class="category" style="color: ${color}; background-color: ${color}20;">${card.category}</span>
              <div class="card-title">${card.title}</div>
              <div class="card-summary">${card.summary}</div>
              <div class="perspective">${card.perspectives?.centre || ""}</div>
            </div>
            `;
          }).join("")}

          <a href="https://getciviq.org" class="cta">Read the full feed →</a>
          
          <div class="footer">
            You're getting this because you signed up for Civiq.<br>
            Built by Shahmeer · Powered by Civic Clarity Foundation · Ontario, Canada
          </div>
        </div>
      </body>
      </html>
    `;

    let sent = 0;
    for (const user of users) {
      if (!user.email) continue;
      await resend.emails.send({
        from: "Civiq Weekly <digest@getciviq.org>",
        to: user.email,
        subject: `This week in Ontario politics 🏛️ · ${new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`,
        html,
      });
      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("digest error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
