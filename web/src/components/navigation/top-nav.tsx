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
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-8">
        <Link href="/" className="flex items-center gap-1.5 text-base font-semibold sm:gap-2 sm:text-lg">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/40 to-blue-500/40 text-cyan-200 sm:size-9 sm:rounded-2xl">
            <span className="text-sm sm:text-base">B</span>
          </div>
          <span className="hidden sm:inline">Bstream</span>
        </Link>

        <form
          action="/search"
          method="get"
          className="hidden flex-1 sm:flex"
        >
          <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 sm:px-4 sm:py-2">
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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {session?.user && (
            <>
              <Link
                href="/search"
                className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20 sm:hidden"
                aria-label="Search"
              >
                <Search className="size-4" />
              </Link>
              <Link
                href="/studio"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 sm:inline-flex"
              >
                <Upload className="size-4" />
                <span className="hidden lg:inline">Upload</span>
              </Link>
            </>
          )}
          <UserMenu session={session} channel={channel} />
        </div>
      </div>
    </header>
  );
}

