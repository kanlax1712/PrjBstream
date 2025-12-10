import Link from "next/link";

type Props = {
  playlists: {
    id: string;
    title: string;
    description: string | null;
    owner: { name: string };
    videos: {
      order: number;
      video: {
        id: string;
        title: string;
        thumbnailUrl: string;
        duration: number;
        videoUrl: string;
      };
    }[];
  }[];
};

export function PlaylistCarousel({ playlists }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="min-w-[260px] rounded-3xl border border-white/5 bg-white/[0.03] p-4"
        >
          <p className="text-xs uppercase tracking-widest text-white/40">
            Playlist
          </p>
          <h3 className="mt-1 text-lg font-semibold">{playlist.title}</h3>
          <p className="text-sm text-white/60">{playlist.description}</p>
          <p className="mt-2 text-xs text-white/40">
            Curated by {playlist.owner.name}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {playlist.videos.slice(0, 3).map((entry) => (
              <Link
                key={entry.video.id}
                href={`/video/${entry.video.id}`}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-cyan-400/30"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-xs font-medium text-white/60">
                  {entry.order + 1}
                </div>
                <div>
                  <p className="line-clamp-1">{entry.video.title}</p>
                  <p className="text-xs text-white/40">
                    {entry.video.duration >= 60 ? `${Math.floor(entry.video.duration / 60)} min` : `${entry.video.duration} sec`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

