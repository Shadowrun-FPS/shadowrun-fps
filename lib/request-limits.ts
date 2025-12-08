/**
 * Request Size Limits and DoS Protection
 */

import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB default
const MAX_HEADER_SIZE = 8192; // 8KB
const MAX_URL_LENGTH = 2048; // 2KB

/**
 * Validates request size limits
 */
export function validateRequestSize(
  request: NextRequest
): { valid: boolean; error?: string } {
  // Check URL length
  if (request.url.length > MAX_URL_LENGTH) {
    return { valid: false, error: "URL too long" };
  }

  // Check header size (approximate)
  let headerSize = 0;
  request.headers.forEach((value, key) => {
    headerSize += key.length + value.length;
  });
  if (headerSize > MAX_HEADER_SIZE) {
    return { valid: false, error: "Headers too large" };
  }

  // Check content-length header
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > MAX_BODY_SIZE) {
      return { valid: false, error: "Request body too large" };
    }
  }

  return { valid: true };
}

/**
 * Middleware to enforce request size limits
 */
export function withRequestLimits(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { maxBodySize?: number } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const maxBodySize = options.maxBodySize || MAX_BODY_SIZE;
    
    // Check URL length
    if (req.url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: "Request URL too long" },
        { status: 414 }
      );
    }

    // Check content-length
    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxBodySize) {
        return NextResponse.json(
          { error: "Request body too large" },
          { status: 413 }
        );
      }
    }

    return handler(req);
  };
}

