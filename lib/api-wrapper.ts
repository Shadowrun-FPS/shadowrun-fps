/**
 * API Route Wrapper with Security Features
 * 
 * Provides rate limiting, error handling, input validation, and security headers
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimiters, getClientIdentifier, safeLog, sanitizeString } from "./security";
import { handleApiError } from "./error-handling";
import { revalidatePath } from "next/cache";

export type ApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse>;

export interface ApiWrapperOptions {
  /** Rate limiter to use: 'api', 'auth', 'upload', or 'admin' */
  rateLimiter?: keyof typeof rateLimiters;
  /** Whether this route requires authentication */
  requireAuth?: boolean;
  /** Whether this route requires admin privileges */
  requireAdmin?: boolean;
  /** Maximum request body size in bytes (default: 1MB) */
  maxBodySize?: number;
  /** Whether to add cache headers (for GET requests) */
  cacheable?: boolean;
  /** Cache duration in seconds (default: 3600) */
  cacheMaxAge?: number;
  /** Paths to revalidate after mutation (for POST/PUT/DELETE) */
  revalidatePaths?: string[];
}

/**
 * Wraps an API route handler with security features
 */
export function withApiSecurity(
  handler: ApiHandler,
  options: ApiWrapperOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Rate limiting
      const rateLimiterType = options.rateLimiter || "api";
      const session = await getServerSession(authOptions);
      const identifier = getClientIdentifier(req, session?.user?.id);
      
      if (!rateLimiters[rateLimiterType].isAllowed(identifier)) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }

      // Request size limit
      const maxBodySize = options.maxBodySize || 1024 * 1024; // 1MB default
      const contentLength = req.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > maxBodySize) {
        return NextResponse.json(
          { error: "Request body too large" },
          { status: 413 }
        );
      }

      // Authentication check
      if (options.requireAuth || options.requireAdmin) {
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (options.requireAdmin) {
          const isAdmin =
            session.user.roles?.includes("admin") ||
            session.user.id === process.env.DEVELOPER_DISCORD_ID;
          if (!isAdmin) {
            return NextResponse.json(
              { error: "Forbidden" },
              { status: 403 }
            );
          }
        }
      }

      // Execute handler
      const response = await handler(req, context);

      // Add cache headers for GET requests
      if (options.cacheable && req.method === "GET") {
        const cacheMaxAge = options.cacheMaxAge || 3600;
        const headers = new Headers(response.headers);
        headers.set(
          "Cache-Control",
          `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 24}`
        );
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      // Revalidate paths for mutations
      if (options.revalidatePaths && ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        options.revalidatePaths.forEach((path) => {
          try {
            revalidatePath(path);
          } catch (error) {
            safeLog.error(`Failed to revalidate path ${path}:`, error);
          }
        });
      }

      return response;
    } catch (error) {
      safeLog.error("API route error:", error);
      return handleApiError(error);
    }
  };
}

/**
 * Validates and sanitizes request body
 */
export function validateBody<T extends Record<string, any>>(
  body: any,
  schema: {
    [K in keyof T]: {
      type: "string" | "number" | "boolean" | "object" | "array";
      required?: boolean;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
    };
  }
): { valid: boolean; data?: T; errors?: string[] } {
  const errors: string[] = [];
  const data: any = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];

    // Check required
    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip validation if not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rules.type === "string") {
      if (typeof value !== "string") {
        errors.push(`${key} must be a string`);
        continue;
      }
      const sanitized = sanitizeString(value, rules.maxLength || 1000);
      if (rules.pattern && !rules.pattern.test(sanitized)) {
        errors.push(`${key} format is invalid`);
        continue;
      }
      data[key] = sanitized;
    } else if (rules.type === "number") {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) {
        errors.push(`${key} must be a number`);
        continue;
      }
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`${key} must be at least ${rules.min}`);
        continue;
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`${key} must be at most ${rules.max}`);
        continue;
      }
      data[key] = num;
    } else {
      data[key] = value;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: data as T };
}

