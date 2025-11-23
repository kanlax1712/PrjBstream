import { AppShell } from "@/components/layout/app-shell";
import { GoLiveClient } from "@/components/go-live/go-live-client";

export default async function GoLivePage() {
  return (
    <AppShell secure>
      <GoLiveClient />
    </AppShell>
  );
}

