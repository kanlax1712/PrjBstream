"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Video, Search, User } from "lucide-react";
import type { Session } from "next-auth";

type MobileNavProps = {
  session: Session | null;
};

const mobileNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/studio", label: "Studio", icon: Video, authOnly: true },
  { href: "/login", label: "Account", icon: User, authOnly: false, showWhenAuth: false },
];

export function MobileNav({ session }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur-md safe-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          if (item.authOnly && !session?.user) return null;
          if (item.showWhenAuth === false && session?.user) return null;
          
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link-liquid flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs transition ${
                isActive
                  ? "text-cyan-400"
                  : "text-white/60"
              }`}
            >
              <Icon className="size-5 relative z-10" />
              <span className="text-[10px] font-medium relative z-10">{item.label}</span>
            </Link>
          );
        })}
        {session?.user && (
          <Link
            href="/profile"
            className={`nav-link-liquid flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs transition ${
              pathname === "/profile"
                ? "text-cyan-400"
                : "text-white/60"
            }`}
          >
            <User className="size-5 relative z-10" />
            <span className="text-[10px] font-medium relative z-10">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

