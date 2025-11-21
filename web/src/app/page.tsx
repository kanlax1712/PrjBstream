import { AppShell } from "@/components/layout/app-shell";
import { FeaturedHero } from "@/components/video/featured-hero";
import { VideoGrid } from "@/components/video/video-grid";
import { PlaylistCarousel } from "@/components/video/playlist-carousel";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { getHomeFeed } from "@/data/home";

export default async function Home() {
  const { hero, secondary, playlists, counts } = await getHomeFeed();

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
