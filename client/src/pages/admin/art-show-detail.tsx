import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ArtShow, ArtShowQrCode } from "@shared/schema";
import { ArrowLeft, Plus, QrCode, Trash2, Download, ExternalLink, Copy, Pencil } from "lucide-react";

const qrCodeFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  price: z.string().min(1, "Price is required").refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Must be a positive number"),
  description: z.string().optional(),
});
type QrCodeFormData = z.infer<typeof qrCodeFormSchema>;

function QrCodeCard({ code, showId }: { code: ArtShowQrCode; showId: string }) {
  const { toast } = useToast();
  const svgRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const checkoutUrl = `${window.location.origin}/pos/${code.id}`;

  const editForm = useForm<QrCodeFormData>({
    resolver: zodResolver(qrCodeFormSchema),
    defaultValues: {
      label: code.label,
      price: code.price,
      description: code.description ?? '',
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: QrCodeFormData) => {
      const res = await apiRequest('PATCH', `/api/art-shows/qr-codes/${code.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows', showId, 'qr-codes'] });
      toast({ title: "QR code updated" });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Failed to update QR code", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/art-shows/qr-codes/${code.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows', showId, 'qr-codes'] });
      toast({ title: "QR code deleted" });
    },
    onError: () => toast({ title: "Failed to delete QR code", variant: "destructive" }),
  });

  const handleDownload = () => {
    const svgEl = svgRef.current?.querySelector('svg');
    if (!svgEl) return;

    const size = 400;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + 90;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(code.label, size / 2, size + 34);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`$${parseFloat(code.price).toFixed(2)}`, size / 2, size + 58);
      if (code.description) {
        ctx.font = '13px sans-serif';
        ctx.fillText(code.description, size / 2, size + 78);
      }
      const link = document.createElement('a');
      link.download = `qr-${code.label.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(checkoutUrl);
    toast({ title: "Checkout URL copied" });
  };

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center gap-4">
        <div className="flex items-start justify-between w-full gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{code.label}</p>
            {code.description && <p className="text-sm text-muted-foreground">{code.description}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-bold">${parseFloat(code.price).toFixed(2)}</span>
            <Dialog open={editOpen} onOpenChange={(o) => {
              setEditOpen(o);
              if (o) editForm.reset({ label: code.label, price: code.price, description: code.description ?? '' });
            }}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit QR Code</DialogTitle>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
                    <FormField control={editForm.control} name="label" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input className="pl-7" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl><Textarea rows={2} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={editMutation.isPending}>Save Changes</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (confirm('Delete this QR code?')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div ref={svgRef} className="border rounded-lg p-3 bg-white">
          <QRCodeSVG value={checkoutUrl} size={180} level="H" />
        </div>

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 bg-muted rounded px-3 py-1.5 text-xs text-muted-foreground truncate font-mono">
            {checkoutUrl}
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={copyUrl} title="Copy URL">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleDownload} title="Download QR">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => window.open(checkoutUrl, '_blank')} title="Preview checkout">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const showEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  artistName: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  description: z.string().optional(),
});
type ShowEditData = z.infer<typeof showEditSchema>;

export default function AdminArtShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editShowOpen, setEditShowOpen] = useState(false);
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
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const { data: show, isLoading: showLoading } = useQuery<ArtShow>({
    queryKey: ['/api/art-shows', id],
    queryFn: () => fetch(`/api/art-shows/${id}`).then(r => r.json()),
  });

  const { data: qrCodes = [], isLoading: codesLoading } = useQuery<ArtShowQrCode[]>({
    queryKey: ['/api/art-shows', id, 'qr-codes'],
    queryFn: () => fetch(`/api/art-shows/${id}/qr-codes`).then(r => r.json()),
  });

  const addForm = useForm<QrCodeFormData>({
    resolver: zodResolver(qrCodeFormSchema),
    defaultValues: { label: '', price: '', description: '' },
  });

  const showEditForm = useForm<ShowEditData>({
    resolver: zodResolver(showEditSchema),
    defaultValues: {
      name: show?.name ?? '',
      artistName: show?.artistName ?? '',
      location: show?.location ?? '',
      eventDate: show?.eventDate ?? '',
      description: show?.description ?? '',
    },
  });

  // Sync show data into edit form when loaded
  useEffect(() => {
    if (show) {
      showEditForm.reset({
        name: show.name,
        artistName: show.artistName ?? '',
        location: show.location ?? '',
        eventDate: show.eventDate ?? '',
        description: show.description ?? '',
      });
    }
  }, [show]);

  const addCodeMutation = useMutation({
    mutationFn: async (data: QrCodeFormData) => {
      const res = await apiRequest('POST', `/api/art-shows/${id}/qr-codes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows', id, 'qr-codes'] });
      toast({ title: "QR code added" });
      setAddOpen(false);
      addForm.reset();
    },
    onError: () => toast({ title: "Failed to add QR code", variant: "destructive" }),
  });

  const updateShowMutation = useMutation({
    mutationFn: async (data: ShowEditData) => {
      const res = await apiRequest('PATCH', `/api/art-shows/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows'] });
      toast({ title: "Show details updated" });
      setEditShowOpen(false);
    },
    onError: () => toast({ title: "Failed to update show", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('PATCH', `/api/art-shows/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/art-shows'] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
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

        <main className="p-4 md:p-6 lg:p-8 max-w-5xl">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/admin/art-shows')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Art Shows
          </Button>

          {showLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          ) : !show ? (
            <p className="text-muted-foreground">Art show not found.</p>
          ) : (
            <>
              {/* Show Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">{show.name}</h2>
                    <Dialog open={editShowOpen} onOpenChange={(o) => {
                      setEditShowOpen(o);
                      if (o) showEditForm.reset({
                        name: show.name,
                        artistName: show.artistName ?? '',
                        location: show.location ?? '',
                        eventDate: show.eventDate ?? '',
                        description: show.description ?? '',
                      });
                    }}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Show Details</DialogTitle>
                        </DialogHeader>
                        <Form {...showEditForm}>
                          <form onSubmit={showEditForm.handleSubmit((d) => updateShowMutation.mutate(d))} className="space-y-4">
                            <FormField control={showEditForm.control} name="name" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Show Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={showEditForm.control} name="artistName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Artist Name</FormLabel>
                                <FormControl><Input placeholder="e.g. Otto" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={showEditForm.control} name="location" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={showEditForm.control} name="eventDate" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={showEditForm.control} name="description" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (optional)</FormLabel>
                                <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="outline" onClick={() => setEditShowOpen(false)}>Cancel</Button>
                              <Button type="submit" disabled={updateShowMutation.isPending}>Save Changes</Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {show.artistName && <span>🎨 {show.artistName}</span>}
                    {show.location && <span>📍 {show.location}</span>}
                    {show.eventDate && <span>📅 {show.eventDate}</span>}
                    {show.description && <span>{show.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={show.status === 'active' ? 'default' : 'secondary'}>
                    {show.status}
                  </Badge>
                  <Select value={show.status} onValueChange={(v) => statusMutation.mutate(v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* QR Codes Section */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">QR Codes</h3>
                  <p className="text-sm text-muted-foreground">One per price tier — print and place next to artwork at the show</p>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add QR Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add QR Code</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground -mt-2">
                      Print this QR code and place it next to artworks at this price.
                    </p>
                    <Form {...addForm}>
                      <form onSubmit={addForm.handleSubmit((d) => addCodeMutation.mutate(d))} className="space-y-4">
                        <FormField control={addForm.control} name="label" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl><Input placeholder='e.g. Original Artwork — 16" x 20"' {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={addForm.control} name="price" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input className="pl-7" placeholder="800.00" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={addForm.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl><Textarea rows={2} placeholder="e.g. Original oil paintings on canvas" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                          <Button type="submit" disabled={addCodeMutation.isPending}>Add QR Code</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {codesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-72 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : qrCodes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-muted rounded-lg text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-base font-medium text-foreground">No QR codes yet</p>
                  <p className="text-sm mt-1">Add a QR code for each price tier at this show.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {qrCodes.map((code) => (
                    <QrCodeCard key={code.id} code={code} showId={id} />
                  ))}
                </div>
              )}

              <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">How it works</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Add a QR code for each price tier (e.g. $300, $800, $1,200).</li>
                  <li>Download and print the QR code — use the download button on each card.</li>
                  <li>Place the matching QR code next to artworks of that price at the show.</li>
                  <li>Customers scan the QR code and complete their purchase on their phone.</li>
                </ol>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
