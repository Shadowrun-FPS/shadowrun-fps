# Security Implementation Guide

This document outlines the security improvements implemented for the Shadowrun FPS application.

## 🔒 Security Features Implemented

### 1. Environment Variables Configuration

All hardcoded Discord IDs and sensitive configuration have been moved to environment variables.

**Required Environment Variables:**

```bash
# Discord Configuration
DEVELOPER_DISCORD_ID=your-developer-discord-id
ADMIN_ROLE_ID=932585751332421642
FOUNDER_ROLE_ID=1095126043918082109
MODERATOR_ROLE_ID=1042168064805965864
GM_ROLE_ID=1080979865345458256

# Rate Limiting
RATE_LIMIT_RPM=60
RATE_LIMIT_WINDOW_MS=60000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### 2. Rate Limiting

- **General API endpoints**: 60 requests per minute
- **Admin endpoints**: 30 requests per minute (more restrictive)
- **Auth endpoints**: 10 requests per minute (most restrictive)
- Rate limits are applied per IP address with proper headers

### 3. Content Security Policy (CSP)

CSP headers are implemented with YouTube video support:

- Restricts script sources to prevent XSS
- Allows YouTube videos via `frame-src` and `media-src`
- Blocks unsafe inline scripts except where necessary

### 4. CORS Configuration

- Socket.io CORS restricted to allowed origins only
- No more `origin: "*"` wildcard usage
- Credentials support enabled for authenticated requests

### 5. Secure Error Handling

- Internal error details are hidden in production
- Safe error messages prevent information disclosure
- Detailed errors only shown in development mode
- Proper HTTP status codes used consistently

### 6. Secure Logging

- Sensitive information (tokens, IDs, etc.) automatically redacted
- Structured logging for better monitoring
- Different log levels for development vs production
- No sensitive data exposed in production logs

### 7. Security Headers

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS in production
- `Permissions-Policy` - Restricts access to sensitive APIs

## 🛠️ Implementation Details

### Security Configuration

All security settings are centralized in `lib/security-config.ts`:

- Discord role IDs
- Rate limiting settings
- CORS origins
- CSP policies

### Rate Limiting

Implemented in `lib/rate-limiting.ts`:

- In-memory storage (consider Redis for production scaling)
- Automatic cleanup of old entries
- IP-based identification with User-Agent

### Error Handling

Secure error handling in `lib/error-handling.ts`:

- Custom `AppError` class for operational errors
- Safe error messages that don't expose internals
- Proper logging without sensitive data exposure

### Secure Logging

Implemented in `lib/secure-logger.ts`:

- Automatic redaction of sensitive patterns
- Structured logging with timestamps
- Different output formats for dev/production

## 🚀 Migration Guide

### For Existing Code

Replace hardcoded Discord IDs:

```typescript
// Before
if (userId === "DISCORD_ID") { ... }

// After
import { SECURITY_CONFIG } from "@/lib/security-config";
if (userId === SECURITY_CONFIG.DEVELOPER_ID) { ... }
```

Replace console.log statements:

```typescript
// Before
console.log("User data:", userData);

// After
import { secureLogger } from "@/lib/secure-logger";
secureLogger.info("User authenticated", { userId: user.id });
```

Use secure error handling:

```typescript
// Before
try { ... } catch (error) {
  console.error(error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// After
import { withErrorHandling, createError } from "@/lib/error-handling";

export const GET = withErrorHandling(async (req) => {
  // If something goes wrong, throw appropriate error:
  throw createError.notFound("Resource not found");
});
```

## 🔍 Security Checklist

- [x] Rate limiting on all API endpoints
- [x] CSP headers with YouTube support
- [x] CORS restricted to allowed origins
- [x] Hardcoded Discord IDs moved to environment variables
- [x] Secure error handling without information disclosure
- [x] Sensitive information redacted from logs
- [x] Security headers implemented
- [x] Socket.io CORS configuration secured

## 🚨 Important Notes

1. **Environment Variables**: Ensure all required environment variables are set in production
2. **Rate Limiting**: Current implementation uses in-memory storage - consider Redis for production scaling
3. **CSP**: The current CSP allows some unsafe-inline scripts - review and tighten as needed
4. **Monitoring**: Set up monitoring for rate limit violations and security events
5. **Regular Updates**: Keep dependencies updated and review security settings periodically

## 📝 Next Steps

1. **Add environment variables** to your deployment environment
2. **Test rate limiting** with your expected traffic patterns
3. **Review CSP settings** and tighten if possible
4. **Set up monitoring** for security events
5. **Consider Redis** for rate limiting in high-traffic scenarios
