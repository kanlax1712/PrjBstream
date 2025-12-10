"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlaylist } from "@/app/actions/playlists";

export function CreatePlaylistForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);

    const result = await createPlaylist(formData);

    if (result.success) {
      e.currentTarget.reset();
      router.refresh();
      setMessage("Playlist created!");
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
        <label className="text-sm text-white/70">Title</label>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="My Playlist"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Description (optional)</label>
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Describe your playlist..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isPublic"
          value="true"
          defaultChecked
          className="rounded border-white/10"
        />
        <label className="text-sm text-white/70">Make playlist public</label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="channel-button-ripple w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create Playlist"}
      </button>
      {message && (
        <p className="text-sm text-emerald-300">{message}</p>
      )}
    </form>
  );
}

