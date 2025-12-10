import { AppShell } from "@/components/layout/app-shell";
import { FeaturedHero } from "@/components/video/featured-hero";
import { VideoGrid } from "@/components/video/video-grid";
import { PlaylistCarousel } from "@/components/video/playlist-carousel";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { getHomeFeed } from "@/data/home";
import { Suspense } from "react";

// Enable caching for faster page loads
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let hero, secondary, playlists, counts;
  try {
    const feed = await getHomeFeed();
    hero = feed.hero;
    secondary = feed.secondary;
    playlists = feed.playlists;
    counts = feed.counts;
  } catch (error) {
    console.error("Error in Home component:", error);
    // Set defaults on error
    hero = null;
    secondary = [];
    playlists = [];
    counts = {
      videos: 0,
      channels: 0,
      communityComments: 0,
    };
  }

  return (
    <AppShell>
      {hero ? (
        <FeaturedHero video={hero} />
      ) : (
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 text-center text-white/70">
          No videos yet. Head to the studio to publish your first story.
        </div>
      )}

      {secondary.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Trending now</h2>
            <p className="text-sm text-white/40">
              Fresh drops from the community
            </p>
          </div>
          <VideoGrid videos={secondary} />
        </section>
      )}

      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Curated playlists</h2>
            <p className="text-sm text-white/40">Finish in a weekend</p>
          </div>
          <PlaylistCarousel playlists={playlists} />
        </section>
      )}

      <InsightCards stats={counts} />
    </AppShell>
  );
}
