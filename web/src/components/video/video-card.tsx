import Image from "next/image";
import Link from "next/link";
import { formatDuration, formatRelative } from "@/lib/format";

type VideoCardProps = {
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    duration: number;
    tags: string;
    publishedAt: Date;
    channel: {
      name: string;
      handle: string;
      avatarUrl: string | null;
    };
  };
};

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-2 transition hover:border-cyan-400/40 hover:bg-white/[0.06] sm:gap-3 sm:rounded-3xl sm:p-3"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900">
        <Image
          src={video.thumbnailUrl && !video.thumbnailUrl.includes("placeholder") && !video.thumbnailUrl.startsWith("data:") 
            ? video.thumbnailUrl 
            : "/uploads/default-thumbnail.svg"}
          alt={video.title}
          width={640}
          height={360}
          className="aspect-video rounded-2xl object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold leading-tight text-white">
          {video.title}
        </p>
        <p className="text-sm text-white/60 line-clamp-2">
          {video.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>{video.channel.name}</span>
          <span>•</span>
          <span>{formatRelative(video.publishedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 text-xs text-cyan-200">
          {video.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-500/30 px-2 py-1 text-[11px]"
              >
                #{tag}
              </span>
            ))}
        </div>
      </div>
    </Link>
  );
}

