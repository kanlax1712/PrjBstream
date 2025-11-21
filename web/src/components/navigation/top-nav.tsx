import Link from "next/link";
import { Search, Upload } from "lucide-react";
import type { Session } from "next-auth";
import { UserMenu } from "@/components/navigation/user-menu";

type TopNavProps = {
  session: Session | null;
  channel:
    | {
        id: string;
        name: string;
        handle: string;
      }
    | null;
};

export function TopNav({ session, channel }: TopNavProps) {
  return (
    <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/40 to-blue-500/40 text-cyan-200">
            <span>B</span>
          </div>
          Bstream
        </Link>

        <form
          action="/search"
          method="get"
          className="hidden flex-1 lg:flex"
        >
          <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            <Search className="size-4" />
            <input
              name="q"
              type="search"
              placeholder="Search creators, tags, or films"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              defaultValue=""
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          {session?.user && (
            <Link
              href="/studio"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 md:inline-flex"
            >
              <Upload className="size-4" />
              Upload
            </Link>
          )}
          <UserMenu session={session} channel={channel} />
        </div>
      </div>
    </header>
  );
}

