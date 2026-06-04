import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://civiq-sooty.vercel.app";

  try {
    const digestRes = await fetch(`${base}/api/digest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });
    const digestData = await digestRes.json();

    return NextResponse.json({ success: true, digest: digestData });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}