"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToChannel, unsubscribeFromChannel } from "@/app/actions/subscriptions";

type Props = {
  channelId: string;
  channelHandle: string;
  isSubscribed: boolean;
};

export function SubscribeButton({
  channelId,
  isSubscribed: initialIsSubscribed,
}: Props) {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = isSubscribed
        ? await unsubscribeFromChannel(channelId)
        : await subscribeToChannel(channelId);

      if (result.success) {
        setIsSubscribed(!isSubscribed);
        router.refresh();
      }
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        isSubscribed
          ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
          : "bg-white text-slate-950 hover:bg-white/90"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {isLoading
        ? "..."
        : isSubscribed
          ? "Subscribed"
          : "Subscribe"}
    </button>
  );
}

