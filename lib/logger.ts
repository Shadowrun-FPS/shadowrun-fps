// Create a logger utility
export const logger = {
  debug: (...args: any[]) => {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DEBUG === "true"
    ) {
      console.log("[DEBUG]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_LOG_LEVEL === "info"
    ) {
      console.log("[INFO]", ...args);
    }
  },
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
};
