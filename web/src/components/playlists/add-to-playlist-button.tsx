"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addVideoToPlaylist } from "@/app/actions/playlists";

type Props = {
  videoId: string;
  playlists: Array<{
    id: string;
    title: string;
  }>;
};

export function AddToPlaylistButton({ videoId, playlists }: Props) {
  const router = useRouter();
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");

  const handleAdd = async () => {
    if (!selectedPlaylist) return;

    setIsAdding(true);
    setMessage("");

    const result = await addVideoToPlaylist(selectedPlaylist, videoId);

    if (result.success) {
      setMessage("Added to playlist!");
      setSelectedPlaylist("");
      setTimeout(() => {
        setMessage("");
        router.refresh();
      }, 1000);
    } else {
      setMessage(result.message);
    }

    setIsAdding(false);
  };

  if (playlists.length === 0) {
    return (
      <div className="text-sm text-white/60">
        <a href="/playlists" className="text-cyan-300 hover:underline">
          Create a playlist
        </a>{" "}
        to add this video.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={selectedPlaylist}
        onChange={(e) => setSelectedPlaylist(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
      >
        <option value="">Select a playlist</option>
        {playlists.map((playlist) => (
          <option key={playlist.id} value={playlist.id}>
            {playlist.title}
          </option>
        ))}
      </select>
      {selectedPlaylist && (
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAdding ? "Adding..." : "Add to Playlist"}
        </button>
      )}
      {message && (
        <p className="text-sm text-emerald-300">{message}</p>
      )}
    </div>
  );
}

