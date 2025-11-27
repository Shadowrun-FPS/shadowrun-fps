import { NextRequest, NextResponse } from "next/server";
import { SECURITY_CONFIG } from "./security-config";

// In-memory store for rate limiting (consider Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, data] of Array.from(requestCounts.entries())) {
      if (now > data.resetTime) {
        requestCounts.delete(key);
      }
    }
    lastCleanup = now;
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  // For authenticated users, also include user ID for more granular control
  const userAgent = request.headers.get("user-agent") || "";
  return `${ip}:${userAgent.slice(0, 50)}`; // Limit user agent length
}

export function rateLimit(
  request: NextRequest,
  options: {
    rpm?: number;
    windowMs?: number;
    skipSuccessfulRequests?: boolean;
  } = {}
): { success: boolean; error?: NextResponse } {
  cleanup();

  const {
    rpm = SECURITY_CONFIG.RATE_LIMIT.RPM,
    windowMs = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  } = options;

  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = requestCounts.get(identifier);

  if (!current || now > current.resetTime) {
    // First request or window expired
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true };
  }

  if (current.count >= rpm) {
    // Rate limit exceeded
    const resetTime = Math.ceil((current.resetTime - now) / 1000);

    return {
      success: false,
      error: NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTime.toString(),
            "X-RateLimit-Limit": rpm.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(current.resetTime / 1000).toString(),
          },
        }
      ),
    };
  }

  // Increment counter
  current.count++;
  requestCounts.set(identifier, current);

  return { success: true };
}

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: { rpm?: number; windowMs?: number }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = rateLimit(req, options);

    if (!rateLimitResult.success) {
      return rateLimitResult.error!;
    }

    return handler(req);
  };
}

// Rate limiting specifically for admin endpoints
// Increased limit for admin operations (map pool management, etc.)
export function adminRateLimit(request: NextRequest) {
  return rateLimit(request, {
    rpm: 60, // Increased from 30 to 60 for admin operations like map pool management
    windowMs: 60000, // 1 minute window
  });
}

// Rate limiting for auth endpoints
export function authRateLimit(request: NextRequest) {
  return rateLimit(request, {
    rpm: 100, // More permissive for auth flows (OAuth requires multiple requests)
    windowMs: 60000, // 1 minute window
  });
}
