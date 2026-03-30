import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronsUpDown, Check, Sparkles, Copy, ExternalLink } from "lucide-react";
import { SiInstagram, SiX, SiFacebook, SiTiktok, SiPinterest } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { Product, SocialSettings } from "@shared/schema";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", Icon: SiInstagram, color: "#E1306C", maxChars: 2200, hashtagNote: "20–30 hashtags", urlKey: "instagram" as keyof SocialSettings },
  { id: "twitter", name: "X (Twitter)", Icon: SiX, color: "#000000", maxChars: 280, hashtagNote: "3–5 hashtags", urlKey: "twitter" as keyof SocialSettings },
  { id: "facebook", name: "Facebook", Icon: SiFacebook, color: "#1877F2", maxChars: 500, hashtagNote: "3–5 hashtags", urlKey: "facebook" as keyof SocialSettings },
  { id: "tiktok", name: "TikTok", Icon: SiTiktok, color: "#010101", maxChars: 150, hashtagNote: "5–8 hashtags", urlKey: "tiktok" as keyof SocialSettings },
  { id: "pinterest", name: "Pinterest", Icon: SiPinterest, color: "#E60023", maxChars: 500, hashtagNote: "5–10 hashtags", urlKey: "pinterest" as keyof SocialSettings },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];
type GeneratedPosts = Partial<Record<PlatformId, string>>;

function charCountColor(current: number, max: number) {
  const pct = current / max;
  if (pct > 1) return "text-red-500";
  if (pct > 0.85) return "text-yellow-500";
  return "text-muted-foreground";
}

function PlatformCard({ platform, content, handle, onChange }: {
  platform: typeof PLATFORMS[number];
  content: string;
  handle?: string;
  onChange: (val: string) => void;
}) {
  const { toast } = useToast();
  const { Icon, name, color, maxChars, hashtagNote } = platform;
  const charCount = content.length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({ title: `Copied ${name} post!` });
  };

  const handleOpen = () => {
    if (handle) window.open(handle.startsWith("http") ? handle : `https://${handle}`, "_blank");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: color + "18" }}>
              <Icon style={{ color, width: 16, height: 16 }} />
            </div>
            <div>
              <CardTitle className="text-sm">{name}</CardTitle>
              {handle && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{handle}</p>}
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-normal">{hashtagNote}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={name === "Instagram" ? 10 : name === "X (Twitter)" ? 4 : 6}
          className="text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <span className={cn("text-xs tabular-nums", charCountColor(charCount, maxChars))}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
          </span>
          <div className="flex gap-2">
            {handle && (
              <Button size="sm" variant="outline" onClick={handleOpen} className="h-7 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />Open
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
              <Copy className="h-3 w-3 mr-1" />Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PostsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"admin" | "live">("admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("admin-sidebar-collapsed") === "true";
    return false;
  });

  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["instagram", "twitter", "facebook"]);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPosts>({});

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && isMobileMenuOpen) setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: socialSettings } = useQuery<SocialSettings>({ queryKey: ["/api/social-settings"] });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/posts/generate", { product: selectedProduct, platforms: selectedPlatforms });
      if (!res.ok) throw new Error("Generation failed");
      return res.json() as Promise<GeneratedPosts>;
    },
    onSuccess: (data) => { setGeneratedPosts(data); toast({ title: "Posts generated!" }); },
    onError: () => toast({ title: "Failed to generate posts", variant: "destructive" }),
  });

  const togglePlatform = (id: PlatformId) =>
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  const updatePost = (platform: PlatformId, value: string) =>
    setGeneratedPosts((prev) => ({ ...prev, [platform]: value }));

  const hasResults = Object.keys(generatedPosts).length > 0;
  const productImage = selectedProduct?.images?.[0];

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

        <main className="p-4 md:p-6 lg:p-8 space-y-6 pb-12">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Social Media Posts</h2>
            <p className="text-muted-foreground mt-1">Select a product, choose your platforms, and generate tailored posts with AI.</p>
          </div>

          {/* Setup + image panel */}
          <Card>
            <CardContent className="pt-5 space-y-5">
              <div className="flex gap-6 items-start">
                {/* Product image */}
                {productImage && (
                  <div className="shrink-0 hidden sm:block">
                    <img
                      src={productImage}
                      alt={selectedProduct?.name}
                      className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-4 min-w-0">
                  {/* Product picker */}
                  <div className="space-y-1.5">
                    <Label>Artwork</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal max-w-md">
                          {selectedProduct ? selectedProduct.name : "Select an artwork…"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[380px]" align="start">
                        <Command>
                          <CommandInput placeholder="Search products…" />
                          <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                              {products.map((p) => (
                                <CommandItem key={p.id} value={p.name} onSelect={() => { setSelectedProduct(p); setOpen(false); setGeneratedPosts({}); }}>
                                  <div className="flex items-center gap-3 min-w-0 w-full">
                                    <Check className={cn("h-4 w-4 shrink-0", selectedProduct?.id === p.id ? "opacity-100" : "opacity-0")} />
                                    {p.images?.[0] && (
                                      <img src={p.images[0]} alt={p.name} className="h-8 w-8 rounded object-cover shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-sm">{p.name}</p>
                                      {p.medium && <p className="text-xs text-muted-foreground truncate">{p.medium}</p>}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Platforms */}
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map(({ id, name, Icon, color, urlKey }) => {
                        const checked = selectedPlatforms.includes(id);
                        const handle = socialSettings?.[urlKey] as string | undefined;
                        return (
                          <button key={id} type="button" onClick={() => togglePlatform(id)}
                            className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                              checked ? "border-primary bg-primary/5 font-medium" : "border-border text-muted-foreground hover:border-muted-foreground"
                            )}
                          >
                            <Icon style={{ color: checked ? color : undefined, width: 14, height: 14 }} />
                            <span>{name}</span>
                            {handle && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                · {handle.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                              </span>
                            )}
                            <Checkbox checked={checked} className="ml-1 h-3.5 w-3.5 pointer-events-none" tabIndex={-1} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile image */}
              {productImage && (
                <div className="sm:hidden">
                  <img src={productImage} alt={selectedProduct?.name} className="w-full max-h-48 object-cover rounded-lg border" />
                </div>
              )}

              {/* Generate button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={!selectedProduct || selectedPlatforms.length === 0 || generateMutation.isPending}
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generateMutation.isPending ? "Generating…" : hasResults ? "Regenerate" : "Generate Posts"}
                </Button>
                {hasResults && <p className="text-xs text-muted-foreground">Edit any post before copying.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Results grid */}
          {hasResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLATFORMS.filter((p) => generatedPosts[p.id]).map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  content={generatedPosts[platform.id] || ""}
                  handle={socialSettings?.[platform.urlKey] as string | undefined}
                  onChange={(val) => updatePost(platform.id, val)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasResults && !generateMutation.isPending && (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an artwork and click Generate to create your posts.</p>
            </div>
          )}

          {generateMutation.isPending && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Crafting your posts…</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
