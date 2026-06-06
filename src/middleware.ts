import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/learn(.*)",
  "/polls(.*)",
  "/profile(.*)",
  "/daily(.*)",
  "/bookmarks(.*)",
  "/opinions(.*)",
  "/pulse(.*)",
  "/challenges(.*)",
]);

// In-memory rate limit store (resets on cold start — good enough for edge)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 60; // requests
const WINDOW_MS = 60 * 1000; // per 1 minute

function getRateLimitKey(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export default clerkMiddleware(async (auth, request) => {
  // Rate limit all API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const key = getRateLimitKey(request);
    const { allowed, remaining } = checkRateLimit(key);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        }
      );
    }

    // Let the request through with remaining header attached
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    // Still run auth check if protected
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
    return response;
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};