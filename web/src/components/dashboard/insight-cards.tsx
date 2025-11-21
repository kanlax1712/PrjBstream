import { formatNumber } from "@/lib/format";

type Props = {
  stats: {
    videos: number;
    channels: number;
    communityComments: number;
  };
};

const labels = {
  videos: "Videos published",
  channels: "Creator channels",
  communityComments: "Community comments",
};

export function InsightCards({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(stats).map(([key, value]) => (
        <div
          key={key}
          className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-4"
        >
          <p className="text-xs uppercase tracking-widest text-white/40">
            {labels[key as keyof typeof labels]}
          </p>
          <p className="text-3xl font-semibold text-white">
            {formatNumber(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

