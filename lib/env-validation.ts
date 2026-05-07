import { safeLog } from "@/lib/security";

/**
 * Validates critical env vars in production so misconfiguration fails fast at boot.
 * Called from instrumentation (Node runtime only).
 *
 * Set `SKIP_ENV_VALIDATION=true` only for CI/analyze pipelines that omit secrets.
 */
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return;
  }

  const missing: string[] = [];
  const weak: string[] = [];

  const requireEnv = (name: string, value: string | undefined) => {
    if (!value?.trim()) missing.push(name);
  };

  requireEnv("MONGODB_URI", process.env.MONGODB_URI);
  requireEnv("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET);
  requireEnv("DISCORD_CLIENT_ID", process.env.DISCORD_CLIENT_ID);
  requireEnv("DISCORD_CLIENT_SECRET", process.env.DISCORD_CLIENT_SECRET);

  const secret = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  if (secret.length > 0 && secret.length < 32) {
    weak.push("NEXTAUTH_SECRET must be at least 32 characters");
  }

  if (!process.env.ADMIN_ROLE_ID?.trim()) {
    safeLog.error(
      "[env] ADMIN_ROLE_ID is unset — RBAC uses default Discord role IDs from security-config. Set ADMIN_ROLE_ID (and related role env vars) in production."
    );
  }

  if (missing.length > 0) {
    safeLog.error(
      `[env] Missing required production variables: ${missing.join(", ")}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (weak.length > 0) {
    safeLog.error(`[env] ${weak.join("; ")}`);
    throw new Error(weak.join("; "));
  }
}
