"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

type Props = {
  session: Session | null;
  channel:
    | {
        name: string;
      }
    | null;
};

export function UserMenu({ session, channel }: Props) {
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()}
        className="login-button-liquid relative overflow-hidden rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all duration-300"
      >
        <span className="relative z-10">Login</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((state) => !state)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-left text-sm text-white/80 transition hover:bg-white/20"
      >
        <div className="relative size-8 overflow-hidden rounded-full border border-white/10">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "Creator avatar"}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-slate-800 text-sm font-semibold">
              {session.user.name?.[0] ?? "?"}
            </div>
          )}
        </div>
        <span className="hidden text-sm font-medium md:block">
          {channel?.name ?? session.user.name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-48 rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-sm text-white/70 shadow-xl backdrop-blur">
          <p className="px-2 text-xs uppercase tracking-wide text-white/40">
            Signed in as
          </p>
          <p className="px-2 py-1 font-medium text-white">
            {session.user.name}
          </p>
          <p className="px-2 pb-3 text-xs text-white/50">{session.user.email}</p>

          <div className="flex flex-col gap-1">
            <Link
              href="/studio"
              className="rounded-xl px-3 py-2 text-white/80 transition hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Creator Studio
            </Link>
            <button
              className="rounded-xl px-3 py-2 text-left text-rose-300 transition hover:bg-white/5"
              onClick={async () => {
                setOpen(false);
                try {
                  // Clear all NextAuth cookies
                  document.cookie.split(";").forEach((c) => {
                    const cookieName = c.trim().split("=")[0];
                    if (cookieName.includes("next-auth") || cookieName.includes("session")) {
                      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    }
                  });
                  
                  // Sign out and redirect
                  await signOut({ 
                    callbackUrl: "/",
                    redirect: true 
                  });
                  
                  // Force hard reload to clear any cached session data
                  setTimeout(() => {
                    window.location.href = "/";
                    window.location.reload();
                  }, 100);
                } catch (error) {
                  console.error("Sign out error:", error);
                  // Force redirect and clear cookies
                  document.cookie.split(";").forEach((c) => {
                    const cookieName = c.trim().split("=")[0];
                    if (cookieName.includes("next-auth") || cookieName.includes("session")) {
                      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    }
                  });
                  window.location.href = "/";
                  window.location.reload();
                }
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

