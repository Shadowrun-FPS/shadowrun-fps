"use client";

import { useEffect, useRef } from "react";
import { safeLog } from "@/lib/security";
import type { RuntimeQueue } from "@/types/admin-queue";

interface UseQueuesDataOptions {
  /** The logged-in user's ID — hook is a no-op when undefined. */
  userId: string | undefined;
  /** Whether the user has privileged access (controls map fetching). */
  isPrivileged: boolean;
  /** Called with the full updated queues array whenever SSE/polling gets new data. */
  onQueuesUpdate: (queues: RuntimeQueue[]) => void;
  /** Called with the maps variants after they are fetched. */
  onMapsUpdate: (maps: unknown[]) => void;
  /** Called with the original (pre-variant) maps array. */
  onOriginalMapsUpdate: (maps: unknown[]) => void;
}

/**
 * Manages real-time queue data via SSE with polling fallback.
 * Callbacks are stored in refs so they never appear as effect deps — the SSE
 * connection only tears down/reconnects when userId or isPrivileged changes.
 */
export function useQueuesData({
  userId,
  isPrivileged,
  onQueuesUpdate,
  onMapsUpdate,
  onOriginalMapsUpdate,
}: UseQueuesDataOptions): void {
  // Keep latest callbacks in refs — avoids restarting SSE on every render
  const onQueuesUpdateRef = useRef(onQueuesUpdate);
  const onMapsUpdateRef = useRef(onMapsUpdate);
  const onOriginalMapsUpdateRef = useRef(onOriginalMapsUpdate);
  useEffect(() => { onQueuesUpdateRef.current = onQueuesUpdate; }, [onQueuesUpdate]);
  useEffect(() => { onMapsUpdateRef.current = onMapsUpdate; }, [onMapsUpdate]);
  useEffect(() => { onOriginalMapsUpdateRef.current = onOriginalMapsUpdate; }, [onOriginalMapsUpdate]);

  useEffect(() => {
    if (!userId) return;

    const fetchQueues = async (useCache = true) => {
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<RuntimeQueue[]>("/api/queues", {
          ttl: useCache ? 10000 : 0,
        });
        onQueuesUpdateRef.current(data);
      } catch (error) {
        safeLog.error("Error fetching queues:", error);
      }
    };

    const fetchMaps = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) throw new Error("Failed to fetch maps");
        const mapsData = (await response.json()) as Array<{
          _id: string;
          name: string;
          gameMode: string;
          smallOption?: boolean;
          src?: string;
        }>;
        onOriginalMapsUpdateRef.current(mapsData);

        const mapsWithVariants: unknown[] = [];
        for (const map of mapsData) {
          mapsWithVariants.push({
            ...map,
            _id: `${map._id}-normal`,
            name: map.name,
            src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
          });
          if (map.smallOption) {
            mapsWithVariants.push({
              ...map,
              _id: `${map._id}-small`,
              name: `${map.name} (Small)`,
              src: `/maps/map_${map.name.toLowerCase().replace(/\s+/g, "")}.png`,
            });
          }
        }
        onMapsUpdateRef.current(mapsWithVariants);
      } catch (error) {
        safeLog.error("Error fetching maps:", error);
      }
    };

    // Initial data load
    void fetchQueues();
    if (isPrivileged) void fetchMaps();

    // SSE + polling setup
    const pollingIntervalMs = 20000;
    const heartbeatTimeoutMs = 30000;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 2000;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let heartbeatCheckInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectAttempts = 0;
    let isPollingActive = false;
    let lastHeartbeat = Date.now();
    let isSSEConnected = false;

    const pollQueues = async () => {
      if (document.hidden) return;
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<RuntimeQueue[]>("/api/queues", { ttl: 10000 });
        onQueuesUpdateRef.current(data);
      } catch (error) {
        safeLog.error("Error polling queues:", error);
      }
    };

    const startPolling = () => {
      if (isPollingActive) return;
      isPollingActive = true;
      void pollQueues();
      pollingInterval = setInterval(() => void pollQueues(), pollingIntervalMs);
    };

    const stopPolling = () => {
      if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
      isPollingActive = false;
    };

    const startHeartbeatMonitoring = () => {
      if (heartbeatCheckInterval) clearInterval(heartbeatCheckInterval);
      heartbeatCheckInterval = setInterval(() => {
        if (
          Date.now() - lastHeartbeat > heartbeatTimeoutMs &&
          isSSEConnected &&
          !isPollingActive
        ) {
          safeLog.log("SSE appears dead (no heartbeat), starting polling fallback");
          isSSEConnected = false;
          startPolling();
        }
      }, 10000);
    };

    const connectSSE = () => {
      if (eventSource) { eventSource.close(); eventSource = null; }
      if (reconnectTimeout) { clearTimeout(reconnectTimeout); reconnectTimeout = null; }

      try {
        eventSource = new EventSource("/api/queues/events");

        eventSource.onopen = () => {
          reconnectAttempts = 0;
          isSSEConnected = true;
          lastHeartbeat = Date.now();
          stopPolling();
          startHeartbeatMonitoring();
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as unknown;
            if (data && typeof data === "object" && "type" in data) {
              const typed = data as { type: string; message?: string };
              if (typed.type === "heartbeat") { lastHeartbeat = Date.now(); return; }
              if (typed.type === "error") { safeLog.error("SSE server error:", typed.message); return; }
            }
            if (Array.isArray(data)) onQueuesUpdateRef.current(data as RuntimeQueue[]);
          } catch (error) {
            safeLog.error("Error parsing SSE data:", error);
          }
        };

        eventSource.onerror = () => {
          isSSEConnected = false;
          if (eventSource) { eventSource.close(); eventSource = null; }
          if (reconnectAttempts >= 2 && !isPollingActive) startPolling();
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connectSSE, delay);
          } else if (!isPollingActive) {
            startPolling();
          }
        };
      } catch (error) {
        safeLog.error("Error creating SSE connection:", error);
        if (reconnectAttempts >= 2 && !isPollingActive) startPolling();
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectSSE, delay);
        } else if (!isPollingActive) {
          startPolling();
        }
      }
    };

    connectSSE();
    startHeartbeatMonitoring();

    const handleVisibilityChange = () => { /* polling skips hidden tabs via pollQueues check */ };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (eventSource) { eventSource.close(); eventSource = null; }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatCheckInterval) clearInterval(heartbeatCheckInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isPrivileged]);
}
