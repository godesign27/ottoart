import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Plus, Trash2, User, BookUser, Users } from "lucide-react";
import type { MailingListEntry, UserSubscription } from "@shared/schema";

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "bg-gray-100 text-gray-700" },
  certificate: { label: "Certificate", color: "bg-amber-100 text-amber-700" },
  contact: { label: "Contact Form", color: "bg-blue-100 text-blue-700" },
  shop: { label: "Shop", color: "bg-green-100 text-green-700" },
};

type SubscriberWithEmail = UserSubscription & { userEmail: string };

function AddContactDialog({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mailing-list", { email, name, notes });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mailing-list"] });
      toast({ title: "Contact added to mailing list" });
      setOpen(false);
      setEmail(""); setName(""); setNotes("");
      onAdded();
    },
    onError: () => toast({ title: "Failed to add contact", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to General List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input id="email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Optional note…" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button
            className="w-full"
            onClick={() => addMutation.mutate()}
            disabled={!email || addMutation.isPending}
          >
            {addMutation.isPending ? "Adding…" : "Add Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MailingListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"admin" | "live">("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("admin-sidebar-collapsed") === "true";
    return false;
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && isMobileMenuOpen) setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isMobileMenuOpen]);

  const { data: entries = [], isLoading: loadingEntries } = useQuery<MailingListEntry[]>({
    queryKey: ["/api/mailing-list"],
  });

  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery<SubscriberWithEmail[]>({
    queryKey: ["/api/subscriptions/all"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/mailing-list/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mailing-list"] });
      toast({ title: "Contact removed" });
    },
    onError: () => toast({ title: "Failed to remove contact", variant: "destructive" }),
  });

  const filteredEntries = entries.filter((e) =>
    !search ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter((s) =>
    !search || s.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        onNavigate={(href) => navigate(href)}
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <AdminHeader
          viewMode={viewMode}
          onViewModeChange={(mode) => { setViewMode(mode); if (mode === "live") navigate("/"); }}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => {
            const next = !isSidebarCollapsed;
            setIsSidebarCollapsed(next);
            localStorage.setItem("admin-sidebar-collapsed", next.toString());
          }}
        />

        <main className="p-4 md:p-6 lg:p-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mailing List</h2>
              <p className="text-muted-foreground mt-1">
                Manage your general contacts and view Mail Club subscribers.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <BookUser className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{entries.length}</div>
                  <div className="text-xs text-muted-foreground">General List</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{subscribers.length}</div>
                  <div className="text-xs text-muted-foreground">Mail Club Subscribers</div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{entries.length + subscribers.length}</div>
                  <div className="text-xs text-muted-foreground">Total Contacts</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="general">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="general">
                  General List
                  <Badge variant="secondary" className="ml-2 text-xs">{entries.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="subscribers">
                  Mail Club Subscribers
                  <Badge variant="secondary" className="ml-2 text-xs">{subscribers.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 h-9"
                />
              </div>
            </div>

            {/* General List Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    General Mailing List
                  </CardTitle>
                  <AddContactDialog onAdded={() => {}} />
                </CardHeader>
                <CardContent className="p-0">
                  {loadingEntries ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
                  ) : filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <BookUser className="h-10 w-10 mb-3 opacity-25" />
                      <p className="text-sm">{search ? "No contacts match your search." : "No contacts yet. Add one or send a certificate to auto-add a buyer."}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredEntries.map((entry) => {
                        const src = SOURCE_LABELS[entry.source] || SOURCE_LABELS.manual;
                        return (
                          <div key={entry.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{entry.name || <span className="text-muted-foreground italic">No name</span>}</p>
                                <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                                {entry.notes && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{entry.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${src.color}`}>{src.label}</span>
                              <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(entry.createdAt)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMutation.mutate(entry.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Mail Club Subscribers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingSubscribers ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
                  ) : filteredSubscribers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Users className="h-10 w-10 mb-3 opacity-25" />
                      <p className="text-sm">{search ? "No subscribers match your search." : "No active Mail Club subscribers yet."}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredSubscribers.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{sub.userEmail}</p>
                              <p className="text-xs text-muted-foreground">Plan ID: {sub.planId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <Badge
                              variant={sub.status === "active" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {sub.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              Since {formatDate(sub.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
