/**
 * Comprehensive Security Utilities
 * 
 * This module provides all security-related utilities including:
 * - Safe logging (replaces console.log/error/warn)
 * - Input validation and sanitization
 * - XSS prevention
 * - Rate limiting
 * - Client identification
 */

/**
 * Safe logger that only logs in development or when explicitly enabled
 * Prevents sensitive data exposure in production logs
 */
export const safeLog = {
  log: (...args: unknown[]) => {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_ENABLED === "true"
    ) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, but sanitize sensitive data
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_ENABLED === "true"
    ) {
      console.error(...args);
    } else {
      // In production, log minimal error info
      const sanitized = args.map((arg) => {
        if (typeof arg === "string") {
          // Remove potential sensitive data patterns
          return arg.replace(/token|password|secret|key|auth/gi, "[REDACTED]");
        }
        return arg;
      });
      console.error(...sanitized);
    }
  },

  warn: (...args: unknown[]) => {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_ENABLED === "true"
    ) {
      console.warn(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG_ENABLED === "true"
    ) {
      console.info(...args);
    }
  },
};

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes string input by removing potentially dangerous characters
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  if (!input || typeof input !== "string") return "";

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitizes markdown-formatted text by escaping HTML while preserving
 * markdown formatting (bold, italic) that will be converted to safe HTML
 */
export function sanitizeMarkdownHtml(text: string): string {
  // First escape all HTML
  let sanitized = escapeHtml(text);

  // Then convert markdown to HTML (safe because we've already escaped)
  sanitized = sanitized
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return sanitized;
}

/**
 * Simple in-memory rate limiter
 * Note: For production at scale, consider using Redis or a dedicated rate limiting service
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter((time) => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints: 30 requests per minute (increased to handle polling)
  api: new RateLimiter(60000, 30),
  // Auth endpoints: 10 requests per minute
  auth: new RateLimiter(60000, 10),
  // Upload endpoints: 5 requests per minute
  upload: new RateLimiter(60000, 5),
  // Admin endpoints: 40 requests per minute
  admin: new RateLimiter(60000, 40),
};

// Cleanup rate limiters every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    Object.values(rateLimiters).forEach((limiter) => limiter.cleanup());
  }, 5 * 60 * 1000);
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers (works on Vercel and most platforms)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

