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
 * Removes emoji and other Extended Pictographic characters from a string.
 * Use for display names (e.g. discordNickname) to show plain text in admin/list views.
 * @param input - String that may contain emojis
 * @returns String with emojis removed and spaces normalized
 */
export function stripEmojis(input: string): string {
  if (!input || typeof input !== "string") return "";
  const stripped = input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

/**
 * Removes all Unicode Symbol characters from a string (\p{S} = Sm, Sc, Sk, So).
 * Catches math symbols, geometric shapes (e.g. ⧎), currency, modifier symbols,
 * and other decorative characters. Keeps letters, numbers, punctuation, and
 * combining marks (e.g. é, ñ).
 */
export function stripSymbols(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/\p{S}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Safe punctuation allowed in display names (no symbols or decorative chars). */
const DISPLAY_NAME_SAFE_PUNCT = " \\-_|.'`,&";

/**
 * Ranges in Mathematical Alphanumeric Symbols (U+1D400–U+1D7FF) that map
 * contiguously to ASCII A-Z or a-z. [start, end, asciiBase] where asciiBase
 * is 0x41 for A-Z or 0x61 for a-z.
 */
const MATH_ALPHA_TO_ASCII: [number, number, number][] = [
  [0x1d400, 0x1d419, 0x41],   // Bold A-Z
  [0x1d41a, 0x1d433, 0x61],   // Bold a-z
  [0x1d434, 0x1d44d, 0x41],   // Italic A-Z
  [0x1d44e, 0x1d467, 0x61],   // Italic a-z
  [0x1d468, 0x1d481, 0x41],   // Bold Italic A-Z
  [0x1d482, 0x1d49b, 0x61],   // Bold Italic a-z
  [0x1d49c, 0x1d4b5, 0x41],   // Script A-Z (has gaps; we map in range)
  [0x1d4b6, 0x1d4cf, 0x61],   // Script a-z
  [0x1d4d0, 0x1d4e9, 0x41],   // Bold Script A-Z
  [0x1d4ea, 0x1d503, 0x61],   // Bold Script a-z
  [0x1d504, 0x1d51c, 0x41],   // Fraktur A-Z (C,H,I,R reserved; we map anyway)
  [0x1d51e, 0x1d537, 0x61],   // Fraktur a-z
  [0x1d538, 0x1d551, 0x41],   // Double-struck A-Z
  [0x1d552, 0x1d56b, 0x61],   // Double-struck a-z
  [0x1d56c, 0x1d585, 0x41],   // Bold Fraktur A-Z
  [0x1d586, 0x1d59f, 0x61],   // Bold Fraktur a-z
  [0x1d5a0, 0x1d5b9, 0x41],   // Sans-serif A-Z
  [0x1d5ba, 0x1d5d3, 0x61],   // Sans-serif a-z
  [0x1d5d4, 0x1d5ed, 0x41],   // Sans-serif Bold A-Z
  [0x1d5ee, 0x1d607, 0x61],   // Sans-serif Bold a-z
  [0x1d608, 0x1d621, 0x41],   // Sans-serif Italic A-Z
  [0x1d622, 0x1d63b, 0x61],   // Sans-serif Italic a-z
  [0x1d63c, 0x1d655, 0x41],   // Sans-serif Bold Italic A-Z
  [0x1d656, 0x1d66f, 0x61],   // Sans-serif Bold Italic a-z
  [0x1d670, 0x1d689, 0x41],   // Monospace A-Z
  [0x1d68a, 0x1d6a3, 0x61],   // Monospace a-z
  [0x1d7e2, 0x1d7eb, 0x30],   // Mathematical Bold 0-9
  [0x1d7ec, 0x1d7f5, 0x30],   // Mathematical Double-struck 0-9
];

/** Fullwidth ASCII variants (e.g. Ｂｅｎ) → normal ASCII. */
const FULLWIDTH_UPPER = 0xff21; // Ａ
const FULLWIDTH_LOWER = 0xff41; // ａ
const FULLWIDTH_DIGIT = 0xff10; // ０

/**
 * Converts "fancy font" Unicode (mathematical Fraktur/Script/Bold, fullwidth)
 * to plain ASCII so the nickname renders in the UI's normal, readable font.
 */
export function normalizeDisplayNameFont(input: string): string {
  if (!input || typeof input !== "string") return "";
  return Array.from(input)
    .map((char) => {
      const code = char.codePointAt(0)!;
      // Fullwidth A-Z, a-z, 0-9 → ASCII
      if (code >= 0xff21 && code <= 0xff3a) return String.fromCodePoint(code - 0xff21 + 0x41);
      if (code >= 0xff41 && code <= 0xff5a) return String.fromCodePoint(code - 0xff41 + 0x61);
      if (code >= 0xff10 && code <= 0xff19) return String.fromCodePoint(code - 0xff10 + 0x30);
      // Mathematical alphanumeric symbols → ASCII
      for (const [start, end, asciiBase] of MATH_ALPHA_TO_ASCII) {
        if (code >= start && code <= end) {
          const offset = code - start;
          const asciiCode = asciiBase + offset;
          if (asciiBase === 0x30) return String.fromCodePoint(asciiCode); // digits
          if (asciiCode <= 0x5a || (asciiCode >= 0x61 && asciiCode <= 0x7a))
            return String.fromCodePoint(asciiCode);
          return char; // reserved slot in block, keep as-is
        }
      }
      return char;
    })
    .join("");
}

/** Code point ranges to strip from display names (decorative / rarely used for names). */
const DISPLAY_NAME_EXCLUDED_RANGES: [number, number][] = [
  [0x12000, 0x123ff], // Cuneiform (e.g. 𒌐)
];

function isInExcludedRange(code: number): boolean {
  return DISPLAY_NAME_EXCLUDED_RANGES.some(
    ([start, end]) => code >= start && code <= end
  );
}

/**
 * Keeps only letters (all scripts except excluded), ASCII digits, and safe
 * punctuation in display names. Strips symbols, decorative Unicode (e.g. ౫, 𒌐),
 * and non-ASCII digits so names show as plain text.
 */
export function allowlistDisplayNameChars(input: string): string {
  if (!input || typeof input !== "string") return "";
  const safe = Array.from(input).filter((char) => {
    const code = char.codePointAt(0)!;
    if (DISPLAY_NAME_SAFE_PUNCT.includes(char)) return true;
    if (code >= 0x30 && code <= 0x39) return true; // ASCII 0-9 only (no ౫ etc.)
    if (/\p{M}/u.test(char)) return true; // combining mark (accents)
    if (/\p{L}/u.test(char)) return !isInExcludedRange(code); // letters, but not excluded blocks
    return false;
  });
  return safe.join("").replace(/\s+/g, " ").trim();
}

/**
 * Returns a display-safe nickname: fancy Unicode font normalized to ASCII,
 * then emojis/symbols stripped and only letters, numbers, safe punctuation kept.
 * Fallback if result is empty. Ensures names render in a consistent, readable font.
 */
export function sanitizeDisplayName(
  nickname: string | null | undefined,
  fallback: string
): string {
  const raw = nickname?.trim() || "";
  if (!raw) return fallback;
  let stripped = normalizeDisplayNameFont(raw);
  stripped = stripEmojis(stripped);
  stripped = stripSymbols(stripped);
  stripped = allowlistDisplayNameChars(stripped);
  return stripped || raw || fallback;
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
  // Public, cacheable reads (non-sensitive): higher cap so admin navigation + home
  // do not share the same tight per-user bucket as the general api limiter
  publicRead: new RateLimiter(60000, 200),
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

