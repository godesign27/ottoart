import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertArtShowSchema, type ArtShow, type InsertArtShow } from "@shared/schema";
import { Plus, QrCode, MapPin, Calendar, Trash2 } from "lucide-react";

export default function AdminArtShowsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const handleNavigate = (href: string) => navigate(href);
  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') navigate('/');
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const { data: shows = [], isLoading } = useQuery<ArtShow[]>({
    queryKey: ['/api/art-shows'],
  });

  const form = useForm<InsertArtShow>({
    resolver: zodResolver(insertArtShowSchema),
    defaultValues: { name: '', artistName: '', description: '', location: '', eventDate: '', status: 'active' },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertArtShow) => {
      const res = await apiRequest('POST', '/api/art-shows', data);
      return res.json();
    },
    onSuccess: (show: ArtShow) => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows'] });
      toast({ title: "Art show created" });
      setOpen(false);
      form.reset();
      navigate(`/admin/art-shows/${show.id}`);
    },
    onError: () => toast({ title: "Failed to create art show", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/art-shows/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows'] });
      toast({ title: "Art show deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <AdminHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => {
            const newCollapsed = !isSidebarCollapsed;
            setIsSidebarCollapsed(newCollapsed);
            localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString());
          }}
        />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">POS Art Shows</h2>
              <p className="text-muted-foreground mt-1">
                Generate QR codes for your art shows. Customers scan to purchase artwork at the listed price.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Art Show
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Art Show</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 mt-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show Name</FormLabel>
                        <FormControl><Input placeholder="Summer Art Fair 2026" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="artistName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Otto" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><Input placeholder="City Arts Centre, Portland" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="eventDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input placeholder="June 14–16, 2026" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex gap-2 justify-end pt-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createMutation.isPending}>Create Show</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : shows.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium text-foreground">No art shows yet</p>
              <p className="text-sm mt-1">Create your first art show to generate QR codes for checkout.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.map((show) => (
                <Card
                  key={show.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/art-shows/${show.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{show.name}</CardTitle>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={show.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {show.status}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this art show and all its QR codes?')) {
                              deleteMutation.mutate(show.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {show.artistName && (
                      <div className="flex items-center gap-1.5">
                        🎨 {show.artistName}
                      </div>
                    )}
                    {show.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {show.location}
                      </div>
                    )}
                    {show.eventDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {show.eventDate}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1 text-primary">
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      Manage QR codes →
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
