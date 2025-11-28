import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { ReactNode } from "react";
import { TopNav } from "@/components/navigation/top-nav";
import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { getSession } from "@/lib/auth-wrapper";
import { prisma } from "@/lib/prisma";

type AppShellProps = {
  children: ReactNode;
  secure?: boolean;
};

export async function AppShell({ children, secure = false }: AppShellProps) {
  let session: Session | null = null;
  let channel = null;

  try {
    session = (await getSession()) as Session | null;
  } catch (error) {
    console.error("Error fetching session in AppShell:", error);
  }

  if (secure && !session?.user) {
    redirect("/login");
  }

  try {
    if (session?.user?.id) {
      channel = await prisma.channel.findFirst({
        where: { ownerId: session.user.id },
        select: {
          id: true,
          name: true,
          handle: true,
          avatarUrl: true,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching channel in AppShell:", error);
    // Continue without channel if database query fails
  }

  return (
    <div className="grid min-h-screen bg-slate-950 text-white md:grid-cols-[220px_1fr]">
      <Sidebar session={session} channel={channel} />
      <div className="flex flex-col border-l border-white/5">
        <TopNav session={session} channel={channel} />
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 md:pb-6 md:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </main>
        <MobileNav session={session} />
      </div>
    </div>
  );
}

