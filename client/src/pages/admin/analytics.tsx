import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ANALYTICS_RANGES, type AnalyticsRange, type AnalyticsSummary } from "@shared/pageViews";
import { cn } from "@/lib/utils";

const TZ = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
})();

const PAGE_NAMES: Record<string, string> = {
  "/": "Home", "/shop-all": "Shop All", "/originals": "Originals", "/prints": "Prints", "/accessories": "Accessories",
  "/bio": "Bio", "/gallery": "Gallery", "/art-wall": "Art Wall", "/events": "Events", "/cv": "CV", "/contact": "Contact",
  "/corporate-buyers": "Corporate Buyers", "/art-rental-leasing": "Art Rental & Leasing", "/commission": "Commission",
  "/mail-club": "Mail Club", "/checkout": "Checkout", "/favorites": "Favorites", "/boards": "Boards",
};

const fmt = (n: number) => n.toLocaleString();

function dayLabel(iso: string, long = false) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, long ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" });
}

/** Every day in the range, including days with no visits. */
function fillDays(summary: AnalyticsSummary) {
  const byDate = new Map(summary.daily.map((d) => [d.date, d]));
  const [y, m, d] = summary.since.split("-").map(Number);
  return Array.from({ length: summary.days }, (_, i) => {
    const day = new Date(y, m - 1, d + i);
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return byDate.get(date) ?? { date, views: 0, visitors: 0 };
  });
}

export default function AdminAnalyticsPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"admin" | "live">("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("admin-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [days, setDays] = useState<AnalyticsRange>(30);

  const { data, isLoading, isError, refetch } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics", { days, tz: TZ }],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?days=${days}&tz=${encodeURIComponent(TZ)}`, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
  });

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [isMobileMenuOpen]);

  const handleSidebarToggle = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try { localStorage.setItem("admin-sidebar-collapsed", String(next)); } catch { /* not saved */ }
  };

  const filled = useMemo(() => (data ? fillDays(data) : []), [data]);
  const peak = Math.max(1, ...filled.map((d) => d.views));
  const empty = data && data.views === 0;

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={setLocation} isCollapsed={isSidebarCollapsed} isMobileMenuOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <AdminHeader
          viewMode={viewMode}
          onViewModeChange={(mode) => { setViewMode(mode); if (mode === "live") setLocation("/"); }}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
                <p className="max-w-[70ch] text-muted-foreground">
                  Visits to ottoart.app. Your own visits while signed in as an admin aren't counted, and neither are search-engine bots.
                </p>
              </div>
              <fieldset>
                <legend className="sr-only">Time range</legend>
                <div className="inline-flex bg-secondary p-1" role="group">
                  {ANALYTICS_RANGES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={days === r}
                      onClick={() => setDays(r)}
                      className={cn(
                        "min-h-10 px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                        days === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                      data-testid={`range-${r}`}
                    >
                      Last {r} days
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {isError ? (
              <Card>
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <p>Analytics couldn't be loaded. Check your connection and try again.</p>
                  <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                  <Stat label="Page views" value={data ? fmt(data.views) : null} note={`Last ${days} days`} testId="stat-views" />
                  <Stat label="Visitors" value={data ? fmt(data.visitors) : null} note="People per day, added up" testId="stat-visitors" />
                  <Stat
                    label="Pages per visitor"
                    value={data ? (data.visitors ? (data.views / data.visitors).toFixed(1) : "–") : null}
                    note="Average for the range"
                    testId="stat-depth"
                  />
                  <Stat
                    label="Most viewed artwork"
                    value={data ? (data.topArtworks[0]?.name ?? "–") : null}
                    note={data?.topArtworks[0] ? `${fmt(data.topArtworks[0].views)} views` : "No artwork views yet"}
                    small
                    testId="stat-top-artwork"
                  />
                </div>

                {empty && (
                  <Card>
                    <CardContent className="p-6">
                      <p className="font-semibold">No visits recorded in this range yet.</p>
                      <p className="mt-1 text-muted-foreground">
                        {data?.firstRecorded
                          ? `Tracking has been on since ${new Date(data.firstRecorded).toLocaleDateString()}. Try a longer range.`
                          : "Tracking starts with the first visit after this update goes live. Sign out, or open the site in a private window, to see your own visit counted."}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Visits by day</CardTitle>
                    <CardDescription>Page views each day ({TZ.replace(/_/g, " ")} time). Point at a bar for the numbers.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-48 animate-pulse bg-muted" />
                    ) : (
                      <>
                        <div className="flex h-48 items-end gap-[2px]" aria-hidden>
                          {filled.map((d) => (
                            <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${dayLabel(d.date, true)}: ${d.views} views, ${d.visitors} visitors`}>
                              <div className="w-full bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${d.views ? Math.max(2, (d.views / peak) * 100) : 0}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden>
                          <span>{filled[0] && dayLabel(filled[0].date)}</span>
                          <span>Busiest day: {fmt(peak === 1 && !data?.views ? 0 : peak)} views</span>
                          <span>{filled.at(-1) && dayLabel(filled.at(-1)!.date)}</span>
                        </div>
                        <table className="sr-only">
                          <caption>Page views and visitors by day</caption>
                          <thead><tr><th scope="col">Day</th><th scope="col">Page views</th><th scope="col">Visitors</th></tr></thead>
                          <tbody>{filled.map((d) => <tr key={d.date}><th scope="row">{dayLabel(d.date, true)}</th><td>{d.views}</td><td>{d.visitors}</td></tr>)}</tbody>
                        </table>
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <RankCard
                    title="Top pages"
                    empty="No page views yet."
                    loading={isLoading}
                    rows={(data?.topPages ?? []).map((p) => ({
                      key: p.path,
                      label: PAGE_NAMES[p.path] ?? (p.name ? `Artwork: ${p.name}` : p.path),
                      href: p.name ? p.path : undefined,
                      value: p.views,
                    }))}
                  />
                  <RankCard
                    title="Top artworks"
                    empty="No artwork pages viewed yet."
                    loading={isLoading}
                    rows={(data?.topArtworks ?? []).map((a) => ({
                      key: a.productId,
                      label: a.name ?? "Removed artwork",
                      href: a.name ? `/product/${a.productId}` : undefined,
                      value: a.views,
                    }))}
                  />
                  <RankCard
                    title="Where visitors came from"
                    description="Other sites that sent visitors. Visits typed in directly or from apps that hide where they came from aren't listed."
                    empty="No visits from other sites yet."
                    loading={isLoading}
                    rows={(data?.referrers ?? []).map((r) => ({ key: r.host, label: r.host, value: r.views }))}
                  />
                  <RankCard
                    title="Devices"
                    empty="No visits yet."
                    loading={isLoading}
                    rows={(data?.devices ?? []).map((d) => ({ key: d.device, label: d.device[0].toUpperCase() + d.device.slice(1), value: d.views }))}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, note, small, testId }: { label: string; value: string | null; note: string; small?: boolean; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {value === null ? (
          <div className="mt-2 h-8 w-2/3 animate-pulse bg-muted" />
        ) : (
          <p className={cn("mt-1 font-bold text-foreground", small ? "line-clamp-2 text-xl leading-tight" : "text-3xl")}>{value}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function RankCard({ title, description, rows, empty, loading }: {
  title: string;
  description?: string;
  rows: Array<{ key: string; label: string; sub?: string; href?: string; value: number }>;
  empty: string;
  loading: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-8 animate-pulse bg-muted" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sr-only"><tr><th scope="col">Name</th><th scope="col">Views</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="relative py-1.5 pr-4 text-left font-normal">
                    <span className="absolute inset-y-1 left-0 bg-secondary" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden />
                    <span className="relative block truncate px-2">
                      {r.href ? <Link href={r.href} className="underline-offset-4 hover:underline">{r.label}</Link> : r.label}
                      {r.sub && <span className="ml-2 text-muted-foreground">{r.sub}</span>}
                    </span>
                  </th>
                  <td className="w-16 py-1.5 text-right font-semibold tabular-nums">{fmt(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
