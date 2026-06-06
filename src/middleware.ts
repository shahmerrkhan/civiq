import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", "/learn(.*)", "/polls(.*)", "/profile(.*)",
  "/daily(.*)", "/bookmarks(.*)", "/opinions(.*)", "/pulse(.*)",
  "/challenges(.*)", "/circles(.*)", "/forecast(.*)", "/witness(.*)",
  "/ontario(.*)", "/debate(.*)", "/map(.*)", "/storylines(.*)",
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Different limits per route sensitivity
function getLimit(pathname: string): { limit: number; window: number } {
  if (pathname.startsWith("/api/circles/posts")) return { limit: 20, window: 60_000 };  // post spam
  if (pathname.startsWith("/api/forecast"))      return { limit: 30, window: 60_000 };  // prediction spam
  if (pathname.startsWith("/api/witness"))       return { limit: 30, window: 60_000 };
  if (pathname.startsWith("/api/opinions"))      return { limit: 15, window: 60_000 };  // opinion spam
  if (pathname.startsWith("/api/polls"))         return { limit: 20, window: 60_000 };
  if (pathname.startsWith("/api/admin"))         return { limit: 60, window: 60_000 };
  if (pathname.startsWith("/api/cron"))          return { limit: 10, window: 60_000 };
  return { limit: 60, window: 60_000 }; // default
}

function getRateLimitKey(req: NextRequest, pathname: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
}

function checkRateLimit(key: string, limit: number, window: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// Clean up old entries every 500 requests to prevent memory leak
let cleanupCounter = 0;
function maybeCleanup() {
  cleanupCounter++;
  if (cleanupCounter % 500 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    maybeCleanup();
    const { limit, window } = getLimit(pathname);
    const key = getRateLimitKey(request, pathname);
    const { allowed, remaining } = checkRateLimit(key, limit, window);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": "0", "Retry-After": "60" } }
      );
    }

    // Block unauthenticated writes on sensitive routes
    const writeMethods = ["POST", "PATCH", "DELETE", "PUT"];
    const sensitiveRoutes = ["/api/circles", "/api/forecast", "/api/witness", "/api/opinions", "/api/polls", "/api/bookmarks", "/api/debate"];
    const isSensitiveWrite = writeMethods.includes(request.method) && sensitiveRoutes.some(r => pathname.startsWith(r));

    if (isSensitiveWrite) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    if (isProtectedRoute(request)) await auth.protect();
    return response;
  }

  if (isProtectedRoute(request)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};