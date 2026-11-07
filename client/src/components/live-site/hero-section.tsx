import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MarketingHero } from "@/components/marketing/hero";
import { ActionLink } from "@/components/marketing/primitives";
import { usePageEnabled } from "@/hooks/use-page-access";

// Home page first screen, in the same layout as the other marketing pages. The picture, artist name and
// portrait come from Admin > Settings; the words are the site's own.
export function HeroSection() {
  const { data: siteSettings } = useQuery<any[]>({
    queryKey: ["/api/site-settings"],
    queryFn: () => apiRequest("GET", "/api/site-settings").then((res) => res.json()),
  });
  const pageEnabled = usePageEnabled();
  const setting = (key: string) => siteSettings?.find((s) => s.key === key)?.value as string | undefined;
  const artistName = setting("artist_artistName") || "Otto Art";
  const profileImage = setting("artist_profileImage");
  const heroImageUrl = siteSettings ? setting("home_heroImageUrl") || null : null;

  return (
    <MarketingHero
      title="Contemporary art, redefined"
      wide
      titleClass="text-[clamp(2rem,6.5vw,4rem)] lg:text-[clamp(2.75rem,4.5vw,4.75rem)]"
      body={<p>Explore a curated collection of original paintings, prints, and artistic expressions that challenge conventional boundaries and inspire new perspectives.</p>}
      actions={<>
        <ActionLink href="/originals" data-testid="shop-originals-button">Shop originals</ActionLink>
        <ActionLink href={pageEnabled("gallery") ? "/gallery" : "/shop-all"} variant="quiet" data-testid="view-portfolio-button">View portfolio</ActionLink>
      </>}
      facts={
        <span className="flex items-center gap-3 text-base text-foreground">
          {profileImage && <img src={profileImage} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />}
          <span><span className="font-semibold">{artistName}</span> <span className="text-muted-foreground">· Contemporary artist</span></span>
        </span>
      }
      image={heroImageUrl}
      imageAlt="Otto Art work"
    />
  );
}
