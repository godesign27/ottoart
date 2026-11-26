import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { refreshOutreach, send, useGmailStatus, useTemplates } from "@/components/admin/outreach/api";
import { ProspectDrawer } from "@/components/admin/outreach/prospect-drawer";
import { AddProspectDialog, ImportDialog, ProspectsPanel, SettingsPanel, TemplatesPanel, ThisWeekPanel } from "@/components/admin/outreach/panels";

// Admin › Outreach: weekly corporate outreach. See docs/outreach-setup.md.

const TABS = ["week", "prospects", "templates", "settings"] as const;
type Tab = (typeof TABS)[number];

export default function AdminOutreachPage({ initialTab }: { initialTab?: Tab } = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"admin" | "live">("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("admin-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [tab, setTab] = useState<Tab>(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    return (TABS as readonly string[]).includes(q ?? "") ? (q as Tab) : initialTab ?? "week";
  });
  const [open, setOpen] = useState<{ id: string; step?: 1 | 2 } | null>(null);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const { data: gmail } = useGmailStatus();
  const { data: tpl } = useTemplates();

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [isMobileMenuOpen]);

  // Coming back from Google's connect screen.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("gmail") === "connected") toast({ title: "Gmail connected" });
    const err = q.get("gmail_error");
    if (err) toast({ title: "Gmail not connected", description: err, variant: "destructive" });
    if (q.has("gmail") || q.has("gmail_error")) window.history.replaceState(null, "", window.location.pathname + (q.get("tab") ? `?tab=${q.get("tab")}` : ""));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check Gmail once per visit: drafts you sent from Gmail, and replies.
  const synced = useRef(false);
  useEffect(() => {
    if (!gmail?.connected || synced.current) return;
    synced.current = true;
    send<{ replied: string[]; sent: number }>("POST", "/api/outreach/sync")
      .then((r) => {
        if (r.replied.length || r.sent) refreshOutreach();
        if (r.replied.length) toast({ title: `New ${r.replied.length === 1 ? "reply" : "replies"}`, description: `${r.replied.join(", ")} replied. Marked as Replied.` });
      })
      .catch(() => undefined);
  }, [gmail?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTab = (t: string) => {
    setTab(t as Tab);
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${t}`);
  };
  const handleSidebarToggle = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try { localStorage.setItem("admin-sidebar-collapsed", String(next)); } catch { /* not saved */ }
  };
  const setupMissing = [
    gmail && !gmail.connected && "connect Gmail",
    tpl && !tpl.postalAddress.trim() && "add your postal address",
  ].filter(Boolean) as string[];
  const openProspect = (id: string, step?: 1 | 2) => setOpen({ id, step });

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
                <h2 className="text-3xl font-bold text-foreground">Outreach</h2>
                <p className="max-w-[70ch] text-muted-foreground">
                  Write to one Boulder company per category each week, with a board of works chosen for them. Drafts go to your Gmail; nothing is sent until you press Send.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setImporting(true)} data-testid="open-import">Import CSV</Button>
                <Button onClick={() => setAdding(true)}>Add prospect</Button>
              </div>
            </div>

            {setupMissing.length > 0 && (
              <div className="flex flex-col gap-3 border-l-4 border-primary bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">Before you can create drafts, {setupMissing.join(" and ")}.</p>
                {tab !== "settings" && <Button size="sm" variant="secondary" onClick={() => changeTab("settings")}>Open settings</Button>}
              </div>
            )}

            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList>
                <TabsTrigger value="week">This week</TabsTrigger>
                <TabsTrigger value="prospects">Prospects</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="week" className="mt-6"><ThisWeekPanel onOpen={openProspect} /></TabsContent>
              <TabsContent value="prospects" className="mt-6"><ProspectsPanel onOpen={openProspect} /></TabsContent>
              <TabsContent value="templates" className="mt-6"><TemplatesPanel /></TabsContent>
              <TabsContent value="settings" className="mt-6"><SettingsPanel /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <ProspectDrawer prospectId={open?.id ?? null} initialStep={open?.step} onClose={() => setOpen(null)} />
      <ImportDialog open={importing} onClose={() => setImporting(false)} />
      <AddProspectDialog open={adding} onClose={() => setAdding(false)} onAdded={(id) => openProspect(id)} />
    </div>
  );
}
