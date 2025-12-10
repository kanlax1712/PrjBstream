import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { formatDuration, formatRelative } from "@/lib/format";

type Props = {
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    duration: number;
    publishedAt: Date;
    tags: string;
    channel: {
      name: string;
      handle: string;
      avatarUrl: string | null;
    };
  };
};

export function FeaturedHero({ video }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/90">
            Premiere
          </p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            {video.title}
          </h1>
          <p className="text-base text-white/70 lg:text-lg">
            {video.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
            <span>{video.channel.name}</span>
            <span>•</span>
            <span>{formatRelative(video.publishedAt)}</span>
            <span>•</span>
            <span>{formatDuration(video.duration)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {video.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href={`/video/${video.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              <Play className="size-4" />
              Watch now
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Go live
            </Link>
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-3xl border border-white/5 bg-slate-900">
          <Image
            src={video.thumbnailUrl && 
              !video.thumbnailUrl.includes("placeholder") && 
              !video.thumbnailUrl.includes("No Thumbnail") &&
              !video.thumbnailUrl.startsWith("data:") 
              ? video.thumbnailUrl 
              : "/uploads/default-thumbnail.svg"}
            alt={`${video.title} poster`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent" />
        </div>
      </div>
    </section>
  );
}

