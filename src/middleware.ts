import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", "/learn(.*)", "/polls(.*)", "/profile(.*)",
  "/daily(.*)", "/bookmarks(.*)", "/opinions(.*)", "/pulse(.*)",
  "/challenges(.*)", "/circles(.*)", "/forecast(.*)", "/witness(.*)",
  "/ontario(.*)", "/debate(.*)", "/map(.*)", "/storylines(.*)",
]);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function getLimiter(pathname: string) {
  if (pathname.startsWith("/api/circles/posts")) return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s") }), limit: 20 };
  if (pathname.startsWith("/api/forecast"))      return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s") }), limit: 30 };
  if (pathname.startsWith("/api/witness"))       return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s") }), limit: 30 };
  if (pathname.startsWith("/api/opinions"))      return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60 s") }), limit: 15 };
  if (pathname.startsWith("/api/polls"))         return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s") }), limit: 20 };
  if (pathname.startsWith("/api/admin"))         return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s") }), limit: 60 };
  if (pathname.startsWith("/api/cron"))          return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s") }), limit: 10 };
  return { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s") }), limit: 60 };
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const ip = getIp(request);
    const routeKey = pathname.split("/").slice(0, 4).join("/");
    const { limiter, limit } = getLimiter(pathname);
    const { success, remaining } = await limiter.limit(`${ip}:${routeKey}`);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": "0", "Retry-After": "60" } }
      );
    }

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