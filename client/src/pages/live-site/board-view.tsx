import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star } from "lucide-react";
import type { Board, Product, BoardItem, BoardStar } from "@shared/schema";

type BoardItemWithProduct = BoardItem & { product: Product };
type BoardStarWithProduct = BoardStar & { product: Product };

export default function BoardViewPage() {
  const params = useParams();
  const slug = params.slug;
  const { toast } = useToast();
  const [identityOpen, setIdentityOpen] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('curator_name') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('curator_email') || '');
  const [selectedImage, setSelectedImage] = useState<{ src: string; name: string } | null>(null);

  const { data, isLoading, error } = useQuery<{ board: Board; items: BoardItemWithProduct[] }>({
    queryKey: ['/api/boards/public', slug],
    queryFn: async () => {
      const res = await fetch(`/api/boards/public/${slug}`);
      if (!res.ok) throw new Error('Board not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: stars = [] } = useQuery<BoardStarWithProduct[]>({
    queryKey: ['/api/boards/public', slug, 'stars'],
    queryFn: async () => {
      const res = await fetch(`/api/boards/public/${slug}/stars`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!slug,
  });

  const starMutation = useMutation({
    mutationFn: async ({ productId, action }: { productId: string; action: 'star' | 'unstar' }) => {
      const res = await apiRequest('POST', `/api/boards/public/${slug}/star`, {
        productId,
        curatorName: name,
        curatorEmail: email,
        action,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards/public', slug, 'stars'] });
    },
    onError: () => {
      toast({ title: "Failed to save selection", variant: "destructive" });
    },
  });

  const isStarred = (productId: string) => {
    return stars.some(s => s.productId === productId && s.curatorEmail === email);
  };

  const handleStarClick = (productId: string) => {
    if (!name || !email) {
      setPendingProductId(productId);
      setIdentityOpen(true);
      return;
    }
    const starred = isStarred(productId);
    starMutation.mutate({ productId, action: starred ? 'unstar' : 'star' });
  };

  const handleIdentitySubmit = () => {
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem('curator_name', name);
    localStorage.setItem('curator_email', email);
    setIdentityOpen(false);
    if (pendingProductId) {
      starMutation.mutate({ productId: pendingProductId, action: 'star' });
      setPendingProductId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h1>
          <p className="text-gray-500">This board may have been removed or is not yet available.</p>
        </div>
      </div>
    );
  }

  const { board, items } = data;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900">{board.name}</h1>
          {board.description && (
            <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">{board.description}</p>
          )}
          {name && (
            <p className="mt-2 text-sm text-gray-400">
              Viewing as {name} · <button onClick={() => setIdentityOpen(true)} className="underline hover:text-gray-600">change</button>
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-16">This board is empty.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map((item) => {
              const starred = isStarred(item.productId);
              return (
                <div key={item.id} className="break-inside-avoid group">
                  <div className="rounded-lg overflow-hidden bg-gray-50 relative">
                    <img
                      src={item.product.images?.[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-full h-auto block cursor-pointer"
                      onClick={() => setSelectedImage({ src: item.product.images?.[0] || '', name: item.product.name })}
                    />
                    <button
                      onClick={() => handleStarClick(item.productId)}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
                        starred
                          ? 'bg-yellow-400 text-white shadow-lg'
                          : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-yellow-500'
                      }`}
                      disabled={starMutation.isPending}
                    >
                      <Star className={`h-5 w-5 ${starred ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="text-base font-medium text-gray-900">{item.product.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {item.product.medium && <span>{item.product.medium}</span>}
                      {item.product.medium && item.product.dimensions && <span>·</span>}
                      {item.product.dimensions && <span>{item.product.dimensions}</span>}
                    </div>
                    {item.product.year && (
                      <p className="text-sm text-gray-400 mt-0.5">{item.product.year}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Please enter your name and email so the artist knows who selected their favorites.</p>
          <div className="space-y-3 mt-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" type="email" />
            <Button onClick={handleIdentitySubmit} disabled={!name.trim() || !email.trim()} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            <div className="relative flex items-center justify-center min-h-[50vh]">
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
