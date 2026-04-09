"use client";

import { useEffect, useRef } from "react";

/**
 * Subscribe to a Pusher public channel and run `onInvalidate` when `eventName` fires.
 * No-op if Pusher env vars are missing. Cleans up on unmount.
 * Callback is always the latest (ref) so callers need not wrap in useCallback.
 */
export function usePusherInvalidate(
  channelName: string | null,
  eventName: string,
  onInvalidate: () => void,
): void {
  const onInvalidateRef = useRef(onInvalidate);
  onInvalidateRef.current = onInvalidate;

  useEffect(() => {
    if (!channelName) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cleaned = false;
    let disconnect: (() => void) | undefined;

    void import("pusher-js").then(({ default: Pusher }) => {
      if (cleaned) return;
      const client = new Pusher(key, { cluster });
      const channel = client.subscribe(channelName);
      const handler = () => {
        onInvalidateRef.current();
      };
      channel.bind(eventName, handler);
      disconnect = () => {
        channel.unbind(eventName, handler);
        client.unsubscribe(channelName);
        client.disconnect();
      };
    });

    return () => {
      cleaned = true;
      disconnect?.();
    };
  }, [channelName, eventName]);
}
