import Image from "next/image";
import Link from "next/link";
import { PlaySquare, Home, Radio, Video, BarChart3, List } from "lucide-react";
import type { Session } from "next-auth";

type SidebarProps = {
  session: Session | null;
  channel:
    | {
        id: string;
        name: string;
        handle: string;
        avatarUrl: string | null;
      }
    | null;
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/studio", label: "Creator Studio", icon: Video, authOnly: true },
  { href: "/go-live", label: "Go Live", icon: Radio, authOnly: true },
  { href: "/subscriptions", label: "Subscriptions", icon: PlaySquare },
  { href: "/playlists", label: "Playlists", icon: List, authOnly: true },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/analytics", label: "Insights", icon: BarChart3, authOnly: true },
];

export function Sidebar({ session, channel }: SidebarProps) {
  return (
    <aside className="hidden h-full flex-col border-r border-white/5 bg-slate-950/40 px-4 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
          <span className="text-lg font-bold">B</span>
        </div>
        Bstream
      </Link>

      {session?.user && channel && (
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden rounded-full border border-white/10">
              {channel.avatarUrl ? (
                <Image
                  src={channel.avatarUrl}
                  alt={channel.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-slate-800 text-lg font-semibold">
                  {channel.name[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-white/60">Channel</p>
              <p className="font-semibold">{channel.name}</p>
              <p className="text-xs text-white/50">@{channel.handle}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {navItems.map((item) => {
          if (item.authOnly && !session?.user) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {!session?.user && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
          <p>Sign in to sync your playlists and creator studio.</p>
          <Link
            href="/login"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950"
          >
            Login
          </Link>
        </div>
      )}
    </aside>
  );
}

