import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, LayoutGrid, Star, Trash2 } from "lucide-react";
import type { Board } from "@shared/schema";

type BoardWithCounts = Board & { itemCount: number; starCount: number; owner: { email: string | null; name: string | null } | null };

const INTENT_LABEL: Record<string, string> = { rent: "Rent or lease", buy: "Buy", "not-sure": "Not sure yet" };

export default function AdminBoardsPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { toast } = useToast();

  const { data: allBoards = [], isLoading } = useQuery<BoardWithCounts[]>({
    queryKey: ['/api/boards'],
  });
  // Your curator boards have no owner; buyer boards were made by signed-in customers on the site.
  const boards = allBoards.filter((b) => !b.ownerUserId);
  const buyerBoards = allBoards.filter((b) => b.ownerUserId)
    .sort((a, b) => new Date(b.quoteRequestedAt ?? 0).getTime() - new Date(a.quoteRequestedAt ?? 0).getTime());
  const quoteCount = buyerBoards.filter((b) => b.quoteRequestedAt).length;

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; slug: string }) => {
      const res = await apiRequest('POST', '/api/boards', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      toast({ title: "Board created" });
    },
    onError: () => {
      toast({ title: "Failed to create board", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/boards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      toast({ title: "Board deleted" });
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    createMutation.mutate({ name: newName, description: newDescription, slug });
  };

  const handleNavigate = (href: string) => setLocation(href);
  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') setLocation('/');
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
              <h2 className="text-2xl font-bold text-foreground">Boards</h2>
              <p className="text-muted-foreground mt-1">Your curated boards for curators, and the boards buyers make on the site</p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> New Board</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Spring Collection 2026"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief description for the curator..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="w-full"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Board'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="curator">
            <TabsList className="mb-6">
              <TabsTrigger value="curator">Your boards ({boards.length})</TabsTrigger>
              <TabsTrigger value="buyer" data-testid="tab-buyer-boards">
                Buyer boards ({buyerBoards.length}){quoteCount > 0 && <span className="ml-2 bg-primary px-1.5 text-xs text-primary-foreground">{quoteCount} quote{quoteCount === 1 ? '' : 's'}</span>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="buyer">
              {buyerBoards.length === 0 ? (
                <p className="py-10 text-muted-foreground">No buyer boards yet. Signed-in visitors make them from any artwork with Save to board, or from the Corporate Buyers and Art Rental pages.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buyerBoards.map((board) => (
                    <Card key={board.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setLocation(`/admin/boards/${board.id}`)} data-testid={`buyer-board-${board.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{board.name}</h3>
                          {board.quoteRequestedAt
                            ? <Badge>Quote requested</Badge>
                            : <Badge variant="secondary">{board.status === 'active' ? 'Shared' : 'Private'}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{board.owner?.name || board.owner?.email || 'Unknown buyer'}{board.owner?.name && board.owner?.email ? ` · ${board.owner.email}` : ''}</p>
                        {board.quoteRequestedAt && (
                          <p className="mt-3 text-sm">
                            {new Date(board.quoteRequestedAt).toLocaleDateString()} · {INTENT_LABEL[board.quoteIntent ?? ''] ?? 'Quote'}
                            {(board.quoteDetails as { location?: string } | null)?.location ? ` · ${(board.quoteDetails as { location?: string }).location}` : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          <span className="flex items-center gap-1"><LayoutGrid className="h-3.5 w-3.5" />{board.itemCount} {board.itemCount === 1 ? 'item' : 'items'}</span>
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{board.starCount} {board.starCount === 1 ? 'star' : 'stars'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="curator">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-16" />
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center py-16">
              <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No boards yet</h3>
              <p className="text-muted-foreground mb-6">Create your first board to start curating selections for art curators.</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Board
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => setLocation(`/admin/boards/${board.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {board.name}
                      </h3>
                      <Badge variant={board.status === 'active' ? 'default' : 'secondary'}>
                        {board.status}
                      </Badge>
                    </div>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{board.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        {board.itemCount} {board.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {board.starCount} {board.starCount === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        {board.createdAt ? new Date(board.createdAt).toLocaleDateString() : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this board?')) deleteMutation.mutate(board.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
