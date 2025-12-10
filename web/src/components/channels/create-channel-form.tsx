"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChannel } from "@/app/actions/channels";

export function CreateChannelForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);

    const result = await createChannel(formData);

    if (result.success) {
      e.currentTarget.reset();
      router.refresh();
      setMessage(result.message);
      // Close form after success
      setTimeout(() => {
        router.push("/studio");
      }, 1500);
    } else {
      setMessage(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.03] p-6"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold">Create Your Channel</h3>
        <p className="mb-4 text-sm text-white/70">
          Create a channel to start uploading and sharing videos with your audience.
        </p>
      </div>

      <div>
        <label className="text-sm text-white/70">Channel Name *</label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={50}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="My Awesome Channel"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Handle *</label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-white/50">@</span>
          <input
            name="handle"
            required
            minLength={2}
            maxLength={30}
            pattern="[a-z0-9-]+"
            className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm lowercase focus:border-cyan-400 focus:outline-none"
            placeholder="my-awesome-channel"
            onChange={(e) => {
              // Auto-format handle: lowercase, replace spaces/special chars with hyphens
              const formatted = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
              e.target.value = formatted;
            }}
          />
        </div>
        <p className="mt-1 text-xs text-white/50">
          Only lowercase letters, numbers, and hyphens. This will be your channel URL.
        </p>
      </div>

      <div>
        <label className="text-sm text-white/70">Description (optional)</label>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Tell viewers about your channel..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="channel-button-ripple w-full rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create Channel"}
      </button>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-emerald-300" : "text-rose-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

