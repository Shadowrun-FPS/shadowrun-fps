/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API calls from being made in parallel.
 * If multiple components request the same endpoint simultaneously,
 * only one request is made and all callers receive the same result.
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 60 * 1000; // 1 minute default cache

  /**
   * Deduplicate a fetch request
   * If the same request is already pending, returns the existing promise
   * If cached and not expired, returns cached result immediately
   */
  async deduplicate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttl?: number; useCache?: boolean }
  ): Promise<T> {
    const ttl = options?.ttl ?? this.defaultTTL;
    const useCache = options?.useCache ?? true;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(key);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < cached.ttl) {
          return cached.data as T;
        }
        // Cache expired, remove it
        this.cache.delete(key);
      }
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // Request already in flight, return existing promise
      return pending.promise;
    }

    // Create new request
    const promise = fetchFn()
      .then((data) => {
        // Cache the result
        if (useCache) {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
          });
        }
        // Remove from pending
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Invalidate cache matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache and pending requests
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Deduplicated fetch wrapper
 */
export async function deduplicatedFetch<T>(
  url: string,
  options?: RequestInit & { ttl?: number; useCache?: boolean }
): Promise<T> {
  const { ttl, useCache, ...fetchOptions } = options || {};
  
  return requestDeduplicator.deduplicate(
    url,
    async () => {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json() as Promise<T>;
    },
    { ttl, useCache }
  );
}

