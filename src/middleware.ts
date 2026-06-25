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

const limiters = {
  circles:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "civiq:rl:circles" }),  limit: 20 },
  forecast: { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "civiq:rl:forecast" }), limit: 30 },
  witness:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "civiq:rl:witness" }),  limit: 30 },
  opinions: { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60 s"), prefix: "civiq:rl:opinions" }), limit: 15 },
  polls:    { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "civiq:rl:polls" }),    limit: 20 },
  admin:    { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "civiq:rl:admin" }),    limit: 60 },
  cron:     { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "civiq:rl:cron" }),     limit: 10 },
  default:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "civiq:rl:default" }), limit: 60 },
};

function getLimiter(pathname: string) {
  if (pathname.startsWith("/api/circles/posts")) return limiters.circles;
  if (pathname.startsWith("/api/forecast"))      return limiters.forecast;
  if (pathname.startsWith("/api/witness"))       return limiters.witness;
  if (pathname.startsWith("/api/opinions"))      return limiters.opinions;
  if (pathname.startsWith("/api/polls"))         return limiters.polls;
  if (pathname.startsWith("/api/admin"))         return limiters.admin;
  if (pathname.startsWith("/api/cron"))          return limiters.cron;
  return limiters.default;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

const BLOCKED_IPS = new Set<string>([
  // Add bad actor IPs here as needed, e.g. "123.456.789.0"
]);

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const ip = getIp(request);

    if (BLOCKED_IPS.has(ip)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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