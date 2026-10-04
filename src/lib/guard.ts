import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Protection for the public /api/suggest endpoint, which spends API credit.
// Neither check can prove a request came from this app (nothing a browser
// sends is secret); together with the Console spend limit they bound abuse.

/**
 * True when the request's Origin is this site. Browsers always send Origin on
 * a POST and pages can't forge it, so this stops other websites using the
 * endpoint; scripts can fake it, which is what the rate limit is for.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    ?.split(",")[0]
    .trim();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Per-IP limits, active only once an Upstash Redis store is connected (Vercel
// Marketplace → Upstash). Serverless instances don't share memory, so an
// in-process counter wouldn't hold across requests.
const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);

const limiters = redisConfigured
  ? (() => {
      const redis = Redis.fromEnv();
      return [
        // Generous for real use: suggestions are debounced to about one per tap.
        new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "aac:suggest:minute" }),
        new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(500, "1 d"), prefix: "aac:suggest:day" }),
      ];
    })()
  : [];

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** False when this client is over a limit. Fails open if Redis is unreachable. */
export async function withinRateLimit(request: Request): Promise<boolean> {
  const ip = clientIp(request);
  try {
    for (const limiter of limiters) {
      if (!(await limiter.limit(ip)).success) return false;
    }
  } catch (err) {
    // An outage shouldn't take suggestions down; the spend limit still applies.
    console.error("Rate limit check failed, allowing request:", err);
  }
  return true;
}
