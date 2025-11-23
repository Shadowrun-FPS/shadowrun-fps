// Secure logging utility to prevent sensitive information leakage

interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: any;
  timestamp: string;
  environment: string;
}

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "key",
  "auth",
  "authorization",
  "cookie",
  "session",
  "email",
  "ip",
  "address",
  "discord_token",
  "access_token",
  "refresh_token",
  "bot_token",
  "webhook",
  "client_secret",
];

// Sensitive values to redact (partial matches)
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9+/]{40,}\b/, // Likely tokens
  /\bmz[A-Za-z0-9]{20,}\b/, // Discord bot tokens
  /\b[0-9]{17,19}\b/, // Discord IDs (but allow in development)
  /\b(?:[a-z0-9+/]{4})*(?:[a-z0-9+/]{2}==|[a-z0-9+/]{3}=)?$/i, // Base64
];

function redactSensitiveData(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return "[Too Deep]";

  if (obj === null || obj === undefined) return obj;

  // Handle Error objects specially
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: process.env.NODE_ENV === "development" ? obj.stack : "[REDACTED]",
    };
  }

  if (typeof obj === "string") {
    // Redact sensitive patterns
    let result = obj;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      result = result.replace(pattern, "[REDACTED]");
    });
    return result;
  }

  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  // Handle empty objects
  if (Object.keys(obj).length === 0) {
    return "[Empty Object]";
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive information
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = redactSensitiveData(value, depth + 1);
    }
  }

  return redacted;
}

function shouldLog(level: LogEntry["level"]): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const logLevel = process.env.LOG_LEVEL || "info";

  // Don't log in test environment unless explicitly enabled
  if (nodeEnv === "test" && !process.env.ENABLE_TEST_LOGS) {
    return false;
  }

  const levels = ["debug", "info", "warn", "error"];
  const currentLevelIndex = levels.indexOf(logLevel);
  const messageLevelIndex = levels.indexOf(level);

  return messageLevelIndex >= currentLevelIndex;
}

function createLogEntry(
  level: LogEntry["level"],
  message: string,
  data?: any
): LogEntry {
  return {
    level,
    message,
    data: data ? redactSensitiveData(data) : undefined,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  };
}

function outputLog(entry: LogEntry): void {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // Pretty print in development
    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}:`;
    console[entry.level](prefix, entry.message, entry.data ? entry.data : "");
  } else {
    // JSON format for production (better for log aggregation)
    console[entry.level](JSON.stringify(entry));
  }
}

// Main logging functions
export const secureLogger = {
  debug: (message: string, data?: any) => {
    if (!shouldLog("debug")) return;
    outputLog(createLogEntry("debug", message, data));
  },

  info: (message: string, data?: any) => {
    if (!shouldLog("info")) return;
    outputLog(createLogEntry("info", message, data));
  },

  warn: (message: string, data?: any) => {
    if (!shouldLog("warn")) return;
    outputLog(createLogEntry("warn", message, data));
  },

  error: (message: string, data?: any) => {
    if (!shouldLog("error")) return;
    outputLog(createLogEntry("error", message, data));
  },

  // Special function for authentication events
  authEvent: (event: string, userId?: string, success?: boolean) => {
    secureLogger.info("Auth Event", {
      event,
      userId: userId ? `[${userId.slice(0, 4)}...]` : undefined,
      success,
    });
  },

  // Special function for Discord events
  discordEvent: (event: string, data?: any) => {
    secureLogger.info("Discord Event", {
      event,
      ...redactSensitiveData(data),
    });
  },

  // Special function for API requests
  apiRequest: (method: string, path: string, userId?: string) => {
    secureLogger.info("API Request", {
      method,
      path,
      userId: userId ? `[${userId.slice(0, 4)}...]` : undefined,
    });
  },
};

// Helper to replace console.log in existing code
export function safeLog(message: string, data?: any): void {
  secureLogger.info(message, data);
}

// Helper to replace console.error in existing code
export function safeError(message: string, error?: any): void {
  secureLogger.error(message, error);
}
