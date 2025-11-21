"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMockSubscriptions } from "@/app/actions/mock-subscriptions";

export function MockSubscriptionsButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    setIsLoading(true);
    setMessage("");

    const result = await createMockSubscriptions();

    if (result.success) {
      setMessage(result.message);
      router.refresh();
    } else {
      setMessage(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating..." : "Create Mock Subscriptions"}
      </button>
      {message && (
        <p className="text-sm text-emerald-300">{message}</p>
      )}
    </div>
  );
}

