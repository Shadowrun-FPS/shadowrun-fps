import Pusher from "pusher";
import PusherClient from "pusher-js";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);

export const subscribeToChannel = (
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) => {
  const channel = pusherClient.subscribe(channelName);
  channel.bind(eventName, callback);

  return () => {
    channel.unbind(eventName, callback);
    pusherClient.unsubscribe(channelName);
  };
};
