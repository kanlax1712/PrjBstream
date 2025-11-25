import Link from "next/link";
import Image from "next/image";
import { Search, Upload } from "lucide-react";
import type { Session } from "next-auth";
import { UserMenu } from "@/components/navigation/user-menu";
import { SearchBar } from "@/components/search/search-bar";

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
        <Link href="/" className="flex items-center gap-1.5 text-base font-semibold sm:gap-2 sm:text-lg" prefetch={false}>
          <div className="relative size-8 overflow-hidden rounded-xl sm:size-9 sm:rounded-2xl">
            <Image
              src="/BS.png?v=1"
              alt="Bstream"
              width={36}
              height={36}
              sizes="(max-width: 640px) 32px, 36px"
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          <span className="hidden sm:inline">Bstream</span>
        </Link>

        <div className="flex-1">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {session?.user && (
            <Link
              href="/studio"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 sm:inline-flex"
            >
              <Upload className="size-4" />
              <span className="hidden lg:inline">Upload</span>
            </Link>
          )}
          <UserMenu session={session} channel={channel} />
        </div>
      </div>
    </header>
  );
}

