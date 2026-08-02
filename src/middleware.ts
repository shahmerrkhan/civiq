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
  learn:    { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "civiq:rl:learn" }),     limit: 5 },
  circles:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "civiq:rl:circles" }),  limit: 20 },
  forecast: { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "civiq:rl:forecast" }), limit: 30 },
  witness:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "civiq:rl:witness" }),  limit: 30 },
  opinions: { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60 s"), prefix: "civiq:rl:opinions" }), limit: 15 },
  polls:    { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "civiq:rl:polls" }),    limit: 20 },
  admin:    { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "civiq:rl:admin" }),    limit: 60 },
  cron:     { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "civiq:rl:cron" }),     limit: 10 },
  feedback: { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "60 s"), prefix: "civiq:rl:feedback" }), limit: 3 },
  // Public and can trigger paid Gemini generation. 20/min is well above the
  // ~2-3 calls a real reader makes while paging the feed.
  feed:     { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "civiq:rl:feed" }),     limit: 20 },
  default:  { limiter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "civiq:rl:default" }), limit: 60 },
};

function getLimiter(pathname: string) {
  if (pathname.startsWith("/api/learn"))        return limiters.learn;
  if (pathname.startsWith("/api/circles/posts")) return limiters.circles;
  if (pathname.startsWith("/api/forecast"))      return limiters.forecast;
  if (pathname.startsWith("/api/witness"))       return limiters.witness;
  if (pathname.startsWith("/api/opinions"))      return limiters.opinions;
  if (pathname.startsWith("/api/polls"))         return limiters.polls;
  if (pathname.startsWith("/api/admin"))         return limiters.admin;
  // /api/cron/daily is the user-facing daily quiz, not a cron job — it must not
  // share the 10/min cron budget or shared-NAT users (schools, mobile) get 429s.
  if (pathname.startsWith("/api/cron/daily"))    return limiters.default;
  if (pathname.startsWith("/api/cron"))          return limiters.cron;
  if (pathname.startsWith("/api/feedback"))      return limiters.feedback;
  if (pathname.startsWith("/api/feed"))          return limiters.feed;
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

// Signed webhooks authenticate themselves and arrive from a small pool of
// provider IPs — IP rate limiting here would silently drop user provisioning.
const RATE_LIMIT_EXEMPT = ["/api/webhooks/"];

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const ip = getIp(request);

    if (BLOCKED_IPS.has(ip)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let remaining = -1;
    if (!RATE_LIMIT_EXEMPT.some((p) => pathname.startsWith(p))) {
      const routeKey = pathname.split("/").slice(0, 4).join("/");
      const { limiter, limit } = getLimiter(pathname);

      // Fail open: if Upstash is unreachable, serve the request rather than
      // 500-ing every API route in the product.
      const result = await limiter
        .limit(`${ip}:${routeKey}`)
        .catch(() => ({ success: true, remaining: -1 }));

      if (!result.success) {
        return NextResponse.json(
          { error: "Too many requests. Slow down." },
          { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": "0", "Retry-After": "60" } }
        );
      }
      remaining = result.remaining;
    }

    const writeMethods = ["POST", "PATCH", "DELETE", "PUT"];
    const sensitiveRoutes = ["/api/circles", "/api/forecast", "/api/witness", "/api/opinions", "/api/polls", "/api/bookmarks", "/api/debate", "/api/admin"];
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
},
{
  // Nonce-based Content-Security-Policy, generated fresh per request.
  //
  // strict: true makes Clerk drop the `https:`/`http:` wildcards from
  // script-src and add 'strict-dynamic' plus a per-request nonce. Under
  // CSP Level 3, 'strict-dynamic' causes browsers to IGNORE 'unsafe-inline'
  // and every host-source expression in script-src, so only the nonced
  // scripts (and what they load) can execute. 'unsafe-inline' remains in the
  // serialized header purely as a fallback for CSP1/CSP2-era browsers, which
  // is the standard strict-CSP pattern. 'unsafe-eval' is added by Clerk only
  // outside production, where React needs it for error overlays.
  contentSecurityPolicy: {
    strict: true,
    // If a CSP violation ever breaks something in production, flip this to
    // true: it switches to Content-Security-Policy-Report-Only, so violations
    // are reported but nothing is blocked. Revert once the gap is patched.
    reportOnly: false,
    directives: {
      "default-src": ["'self'"],
      // style-src must keep 'unsafe-inline': nonces only apply to <style>
      // elements, not to inline style="" attributes, and this UI is built on
      // ~1400 React inline style props that are serialized as attributes
      // during SSR. Dropping it would render every page unstyled.
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "blob:", "data:", "https://img.clerk.com", "https://*.clerk.com"],
      "connect-src": [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://clerk.getciviq.org",
        "https://*.ingest.sentry.io",
        "https://*.ingest.us.sentry.io",
        "wss:",
      ],
      "frame-src": ["'self'", "https://challenges.cloudflare.com", "https://*.clerk.accounts.dev"],
      "worker-src": ["'self'", "blob:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],
      "upgrade-insecure-requests": [],
    },
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};