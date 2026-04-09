import Pusher from "pusher";
import { safeLog } from "@/lib/security";
import {
  QUEUES_LIST_PUSHER_CHANNEL,
  QUEUES_LIST_PUSHER_EVENT,
} from "@/lib/queues-realtime-constants";

let serverPusher: Pusher | null = null;

function getPusher(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    return null;
  }
  if (!serverPusher) {
    serverPusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }
  return serverPusher;
}

/** Notify admin queues page and anyone subscribed to queue list changes. */
export function triggerQueuesListUpdate(): void {
  try {
    const pusher = getPusher();
    if (!pusher) return;
    void pusher.trigger(QUEUES_LIST_PUSHER_CHANNEL, QUEUES_LIST_PUSHER_EVENT, {
      t: Date.now(),
    });
  } catch (err) {
    safeLog.error("queues-list Pusher trigger failed:", err);
  }
}
