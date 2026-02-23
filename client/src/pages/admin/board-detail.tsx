import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, Plus, X, Copy, Star, ExternalLink, Search, Pencil, Check, LayoutGrid, Users, GripVertical } from "lucide-react";
import type { Board, Product, BoardItem, BoardStar } from "@shared/schema";

type BoardItemWithProduct = BoardItem & { product: Product };
type BoardStarWithProduct = BoardStar & { product: Product };

export default function AdminBoardDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const boardId = params.id;
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: board, isLoading: boardLoading } = useQuery<Board>({
    queryKey: ['/api/boards', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error('Board not found');
      return res.json();
    },
    enabled: !!boardId,
  });

  const { data: boardItems = [] } = useQuery<BoardItemWithProduct[]>({
    queryKey: ['/api/boards', boardId, 'items'],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/items`);
      return res.json();
    },
    enabled: !!boardId,
  });

  const { data: boardStars = [] } = useQuery<BoardStarWithProduct[]>({
    queryKey: ['/api/boards', boardId, 'stars'],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/stars`);
      return res.json();
    },
    enabled: !!boardId,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const updateBoardMutation = useMutation({
    mutationFn: async (data: Partial<Board>) => {
      const res = await apiRequest('PATCH', `/api/boards/${boardId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest('POST', `/api/boards/${boardId}/items`, { productId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      toast({ title: "Product added to board" });
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest('DELETE', `/api/boards/${boardId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      toast({ title: "Product removed from board" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const res = await apiRequest('PATCH', `/api/boards/${boardId}/items/reorder`, { itemIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId, 'items'] });
    },
  });

  const handleDrop = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...boardItems];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderMutation.mutate(reordered.map(item => item.id));
  };

  const handleNavigate = (href: string) => setLocation(href);
  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') setLocation('/');
  };

  const handleStatusToggle = (checked: boolean) => {
    updateBoardMutation.mutate({ status: checked ? 'active' : 'draft' });
  };

  const boardItemProductIds = new Set(boardItems.map(item => item.productId));
  const availableProducts = allProducts
    .filter(p => !boardItemProductIds.has(p.id))
    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const shareUrl = board ? `${window.location.origin}/board/${board.slug}` : '';

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "URL copied to clipboard" });
  };

  const starsByCurator = boardStars.reduce((acc, star) => {
    const key = `${star.curatorName} (${star.curatorEmail})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(star);
    return acc;
  }, {} as Record<string, BoardStarWithProduct[]>);

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

  if (boardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar onNavigate={handleNavigate} isCollapsed={isSidebarCollapsed} isMobileMenuOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} isSidebarCollapsed={isSidebarCollapsed} onSidebarToggle={() => { const n = !isSidebarCollapsed; setIsSidebarCollapsed(n); localStorage.setItem('admin-sidebar-collapsed', n.toString()); }} />
          <main className="p-4 md:p-6 lg:p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-muted rounded" />)}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Board not found</h2>
          <Button onClick={() => setLocation('/admin/boards')}>Back to Boards</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} isCollapsed={isSidebarCollapsed} isMobileMenuOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} isSidebarCollapsed={isSidebarCollapsed} onSidebarToggle={() => { const n = !isSidebarCollapsed; setIsSidebarCollapsed(n); localStorage.setItem('admin-sidebar-collapsed', n.toString()); }} />

        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <Button variant="ghost" onClick={() => setLocation('/admin/boards')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2">
            <ChevronLeft className="h-4 w-4" /> Back to Boards
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <LayoutGrid className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-foreground">{boardItems.length}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card className={boardStars.length > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' : ''}>
              <CardContent className="p-4 text-center">
                <Star className={`h-6 w-6 mx-auto mb-2 ${boardStars.length > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                <div className="text-2xl font-bold text-foreground">{boardStars.length}</div>
                <div className="text-sm text-muted-foreground">Starred</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">{Object.keys(starsByCurator).length}</div>
                <div className="text-sm text-muted-foreground">Curators</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`h-6 w-6 mx-auto mb-2 rounded-full ${board.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="text-2xl font-bold text-foreground capitalize">{board.status}</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold h-auto py-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateBoardMutation.mutate({ name: editName }, {
                          onSuccess: () => { setIsEditingName(false); toast({ title: "Board name updated" }); }
                        });
                      }
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={() => {
                    updateBoardMutation.mutate({ name: editName }, {
                      onSuccess: () => { setIsEditingName(false); toast({ title: "Board name updated" }); }
                    });
                  }}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h2
                  className="text-2xl font-bold text-foreground group/name inline-flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { setEditName(board.name); setIsEditingName(true); }}
                >
                  {board.name}
                  <Pencil className="h-4 w-4 opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground" />
                </h2>
              )}
              {isEditingDescription ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="text-sm h-auto py-1"
                    placeholder="Board description..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateBoardMutation.mutate({ description: editDescription }, {
                          onSuccess: () => { setIsEditingDescription(false); toast({ title: "Description updated" }); }
                        });
                      }
                      if (e.key === 'Escape') setIsEditingDescription(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={() => {
                    updateBoardMutation.mutate({ description: editDescription }, {
                      onSuccess: () => { setIsEditingDescription(false); toast({ title: "Description updated" }); }
                    });
                  }}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p
                  className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors group/desc inline-flex items-center gap-2"
                  onClick={() => { setEditDescription(board.description || ''); setIsEditingDescription(true); }}
                >
                  {board.description || 'Click to add description'}
                  <Pencil className="h-3 w-3 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Draft</span>
              <Switch
                checked={board.status === 'active'}
                onCheckedChange={handleStatusToggle}
              />
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant={board.status === 'active' ? 'default' : 'secondary'}>{board.status}</Badge>
            </div>
          </div>

          {board.status === 'active' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-1 block">Share URL</label>
                    <div className="flex items-center gap-2">
                      <Input value={shareUrl} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={copyShareUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Board Items ({boardItems.length})</h3>
              <Button onClick={() => setAddProductOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Products
              </Button>
            </div>

            {boardItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No products added yet</p>
                <Button variant="outline" onClick={() => setAddProductOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boardItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => { e.preventDefault(); setDropIndex(index); }}
                    onDragLeave={() => setDropIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null) handleDrop(dragIndex, index);
                      setDragIndex(null);
                      setDropIndex(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
                    className={`relative group rounded-lg overflow-hidden border bg-card cursor-grab active:cursor-grabbing transition-all ${
                      dragIndex === index ? 'opacity-50 scale-95' : ''
                    } ${dropIndex === index && dragIndex !== index ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 text-white rounded px-1.5 py-0.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-3 w-3" />
                      {index + 1}
                    </div>
                    <div className="aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={item.product.images?.[0] || '/placeholder.svg'}
                        alt={item.product.name}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                      {item.product.medium && <p className="text-xs text-muted-foreground">{item.product.medium}</p>}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); removeItemMutation.mutate(item.id); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {boardStars.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Curator Selections ({boardStars.length})
              </h3>
              {Object.entries(starsByCurator).map(([curator, stars]) => (
                <div key={curator} className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3 bg-muted/50 px-3 py-2 rounded">{curator}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {stars.map((star) => (
                      <div key={star.id} className="rounded-lg overflow-hidden border bg-card">
                        <div className="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={star.product.images?.[0] || '/placeholder.svg'}
                            alt={star.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-foreground truncate">{star.product.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Products to Board</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mt-2">
            {availableProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No matching products found' : 'All products have been added'}
              </p>
            ) : (
              availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => addItemMutation.mutate(product.id)}
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    <img
                      src={product.images?.[0] || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.medium || 'No medium'} {product.dimensions ? `· ${product.dimensions}` : ''}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
