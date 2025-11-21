import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { ReactNode } from "react";
import { TopNav } from "@/components/navigation/top-nav";
import { Sidebar } from "@/components/navigation/sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AppShellProps = {
  children: ReactNode;
  secure?: boolean;
};

export async function AppShell({ children, secure = false }: AppShellProps) {
  const session = (await auth()) as Session | null;

  if (secure && !session?.user) {
    redirect("/login");
  }

  const channel =
    session?.user?.id
      ? await prisma.channel.findFirst({
          where: { ownerId: session.user.id },
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        })
      : null;

  return (
    <div className="grid min-h-screen bg-slate-950 text-white md:grid-cols-[220px_1fr]">
      <Sidebar session={session} channel={channel} />
      <div className="flex flex-col border-l border-white/5">
        <TopNav session={session} channel={channel} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

