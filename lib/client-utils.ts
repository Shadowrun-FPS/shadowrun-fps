/**
 * Client-side utilities for forms, validation, and UI improvements
 */

/**
 * Prevents duplicate form submissions
 */
export function preventDuplicateSubmission(
  isSubmitting: boolean,
  submitFn: () => void | Promise<void>
) {
  if (isSubmitting) {
    return;
  }
  return submitFn();
}

/**
 * Client-side email validation
 */
export function isValidEmailClient(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Client-side string sanitization
 */
export function sanitizeStringClient(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") return "";
  let sanitized = input.trim().slice(0, maxLength);
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  return sanitized;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(", ");
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely get item from localStorage
 * Returns null if localStorage is unavailable (e.g., cookies disabled)
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // localStorage is disabled (e.g., cookies blocked in Chrome)
    // Silently fail - this is expected behavior when privacy settings block storage
    return null;
  }
}

/**
 * Safely set item in localStorage
 * Silently fails if localStorage is unavailable (e.g., cookies disabled)
 */
export function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // localStorage is disabled (e.g., cookies blocked in Chrome)
    // Silently fail - this is expected behavior when privacy settings block storage
  }
}

/**
 * Safely remove item from localStorage
 * Silently fails if localStorage is unavailable (e.g., cookies disabled)
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // localStorage is disabled (e.g., cookies blocked in Chrome)
    // Silently fail - this is expected behavior when privacy settings block storage
  }
}

/**
 * Check if cookies are available in the browser
 * Returns true if cookies can be set, false otherwise
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === "undefined") return false;
  
  try {
    // Try to set a test cookie
    document.cookie = "testCookie=1; path=/; SameSite=Lax";
    const cookiesEnabled = document.cookie.indexOf("testCookie=") !== -1;
    // Clean up test cookie
    document.cookie = "testCookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    return cookiesEnabled;
  } catch (error) {
    return false;
  }
}

/**
 * Check if localStorage is available
 * Returns true if localStorage can be accessed, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

