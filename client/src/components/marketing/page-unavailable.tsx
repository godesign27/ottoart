import { Link } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ActionLink, Frame } from "./primitives";

/** What visitors see on a page that's switched off in Admin > Pages. */
export function PageUnavailable({ suggestion }: { suggestion: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <LiveSiteNavigation />
      <main className="flex flex-1 items-center py-24" data-testid="page-unavailable">
        <Frame>
          <div className="max-w-xl">
            <h1 className="font-display text-4xl leading-tight tracking-[-0.02em] md:text-5xl">This page isn’t available</h1>
            <p className="mt-6 text-lg leading-relaxed">{suggestion}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ActionLink href="/contact">Contact us</ActionLink>
              <ActionLink href="/shop-all" variant="quiet">Shop all art</ActionLink>
            </div>
          </div>
        </Frame>
      </main>
      <Footer />
    </div>
  );
}

/** Shown to an admin viewing a page that's switched off. */
export function AdminOffNotice({ adminHref }: { adminHref: string }) {
  return (
    <div role="status" /* taste-skill-ignore: floating notice */ className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-lg dark:bg-amber-950 dark:text-amber-50" data-testid="page-off-notice">
      This page is off. Only admins can see it. <Link href={adminHref} className="font-semibold underline underline-offset-2">Turn it on</Link>
    </div>
  );
}
