import { NextResponse } from "next/server";
import { safeLog } from "./security";

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  isOperational?: boolean;
}

// Create a custom error class for operational errors
export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Safe error messages that don't expose internal details
const SAFE_ERROR_MESSAGES = {
  400: "Invalid request data",
  401: "Authentication required",
  403: "Access denied",
  404: "Resource not found",
  409: "Resource conflict",
  422: "Invalid input data",
  429: "Too many requests",
  500: "Internal server error",
  502: "Service temporarily unavailable",
  503: "Service unavailable",
} as const;

// Determine if error details should be exposed
function shouldExposeError(error: any): boolean {
  // Only expose operational errors in development
  const isDevelopment = process.env.NODE_ENV === "development";
  const isOperationalError = error instanceof AppError && error.isOperational;

  return isDevelopment || isOperationalError;
}

// Extract safe error information
function getSafeErrorInfo(error: any): {
  message: string;
  statusCode: number;
  code?: string;
} {
  // Default to 500 if no status code is provided
  const statusCode = error.statusCode || error.status || 500;

  // Use safe message if we shouldn't expose the error
  const message = shouldExposeError(error)
    ? error.message
    : SAFE_ERROR_MESSAGES[statusCode as keyof typeof SAFE_ERROR_MESSAGES] ||
      SAFE_ERROR_MESSAGES[500];

  return {
    message,
    statusCode,
    code: error.code,
  };
}

// Secure error response handler
export function handleApiError(error: any): NextResponse {
  const { message, statusCode, code } = getSafeErrorInfo(error);

  // Log the actual error for debugging (only in server logs)
  if (process.env.NODE_ENV !== "test") {
    if (statusCode >= 500) {
      safeLog.error("API Error:", {
        message: error.message,
        stack: error.stack,
        statusCode,
        code,
        timestamp: new Date().toISOString(),
      });
    } else {
      safeLog.warn("API Error:", {
        message: error.message,
        stack: error.stack,
        statusCode,
        code,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Return safe error response
  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
        stack: error.stack,
      }),
    },
    { status: statusCode }
  );
}

// Wrapper for API route handlers with error handling
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Common error creators
export const createError = {
  badRequest: (message = "Invalid request") => new AppError(message, 400),
  unauthorized: (message = "Authentication required") =>
    new AppError(message, 401),
  forbidden: (message = "Access denied") => new AppError(message, 403),
  notFound: (message = "Resource not found") => new AppError(message, 404),
  conflict: (message = "Resource conflict") => new AppError(message, 409),
  unprocessable: (message = "Invalid input data") => new AppError(message, 422),
  tooManyRequests: (message = "Too many requests") =>
    new AppError(message, 429),
  internal: (message = "Internal server error") =>
    new AppError(message, 500, undefined, false),
};

// Database error handler
export function handleDatabaseError(error: any): AppError {
  // Don't expose database details
  safeLog.error("Database Error:", error);

  if (error.code === 11000) {
    return createError.conflict("Resource already exists");
  }

  return createError.internal("Database operation failed");
}

// Discord API error handler
export function handleDiscordError(error: any, operation: string): AppError {
  safeLog.error(`Discord API Error (${operation}):`, error);

  // Don't expose Discord API details
  return createError.internal("External service error");
}
