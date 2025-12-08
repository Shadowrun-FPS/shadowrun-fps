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

