import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  Download, 
  Share2, 
  Maximize2, 
  Move, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Home,
  Bed,
  Briefcase,
  ChefHat
} from "lucide-react";
import type { Product, RoomBackground } from "@shared/schema";

interface ArtworkPlacement {
  productId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

interface ArtWallSimulatorProps {
  products?: Product[];
  className?: string;
}

const roomTypeIcons = {
  living_room: Home,
  bedroom: Bed,
  office: Briefcase,
  dining_room: ChefHat,
};

export function ArtWallSimulator({ products = [], className }: ArtWallSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedBackground, setSelectedBackground] = useState<string>("");
  const [artworks, setArtworks] = useState<ArtworkPlacement[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Fetch room backgrounds
  const { data: roomBackgrounds = [] } = useQuery<RoomBackground[]>({
    queryKey: ['/api/room-backgrounds'],
  });

  // Set default background when data loads
  useEffect(() => {
    if (roomBackgrounds.length > 0 && !selectedBackground) {
      const defaultBg = roomBackgrounds.find(bg => bg.isDefault) || roomBackgrounds[0];
      setSelectedBackground(defaultBg.id);
    }
  }, [roomBackgrounds, selectedBackground]);

  const selectedBg = roomBackgrounds.find(bg => bg.id === selectedBackground);

  const addArtwork = (product: Product) => {
    if (!product.images?.[0]) return;
    
    const newArtwork: ArtworkPlacement = {
      productId: product.id,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      zIndex: artworks.length + 1,
    };
    
    setArtworks(prev => [...prev, newArtwork]);
    setSelectedArtwork(product.id);
  };

  const removeArtwork = (productId: string) => {
    setArtworks(prev => prev.filter(art => art.productId !== productId));
    if (selectedArtwork === productId) {
      setSelectedArtwork(null);
    }
  };

  const updateArtwork = useCallback((productId: string, updates: Partial<ArtworkPlacement>) => {
    setArtworks(prev => 
      prev.map(art => 
        art.productId === productId ? { ...art, ...updates } : art
      )
    );
  }, []);

  const getSelectedArtworkData = () => {
    if (!selectedArtwork) return null;
    return artworks.find(art => art.productId === selectedArtwork);
  };

  const selectedProduct = products.find(p => p.id === selectedArtwork);
  const selectedArtworkData = getSelectedArtworkData();

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked artwork (reverse order for proper z-index handling)
    const clickedArtwork = [...artworks]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(art => {
        return x >= art.x && x <= art.x + art.width &&
               y >= art.y && y <= art.y + art.height;
      });

    if (clickedArtwork) {
      setSelectedArtwork(clickedArtwork.productId);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedArtwork.x,
        y: y - clickedArtwork.y,
      });
    } else {
      setSelectedArtwork(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedArtwork) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    updateArtwork(selectedArtwork, { x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const clearWall = () => {
    setArtworks([]);
    setSelectedArtwork(null);
  };

  const resetArtwork = () => {
    if (!selectedArtwork || !selectedArtworkData) return;
    updateArtwork(selectedArtwork, {
      width: 200,
      height: 200,
      rotation: 0,
    });
  };

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (selectedBg?.imageUrl) {
      const bgImage = new Image();
      bgImage.onload = () => {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Draw artworks
        artworks
          .sort((a, b) => a.zIndex - b.zIndex)
          .forEach(artwork => {
            const product = products.find(p => p.id === artwork.productId);
            if (!product?.images?.[0]) return;

            const artImage = new Image();
            artImage.onload = () => {
              ctx.save();
              
              // Apply transformations
              ctx.translate(artwork.x + artwork.width / 2, artwork.y + artwork.height / 2);
              ctx.rotate((artwork.rotation * Math.PI) / 180);
              ctx.drawImage(
                artImage,
                -artwork.width / 2,
                -artwork.height / 2,
                artwork.width,
                artwork.height
              );

              // Draw selection indicator
              if (selectedArtwork === artwork.productId) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(
                  -artwork.width / 2 - 2,
                  -artwork.height / 2 - 2,
                  artwork.width + 4,
                  artwork.height + 4
                );
              }
              
              ctx.restore();
            };
            artImage.src = product.images[0];
          });
      };
      bgImage.src = selectedBg.imageUrl;
    }
  }, [selectedBg, artworks, selectedArtwork, products]);

  const RoomTypeIcon = selectedBg ? roomTypeIcons[selectedBg.roomType as keyof typeof roomTypeIcons] : Home;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Virtual Art Wall Simulator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Visualize how artworks will look in different room settings
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Room Background Selection */}
          <Card data-testid="room-selector-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <RoomTypeIcon className="w-5 h-5" />
                Room Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-select">Choose a room:</Label>
                <Select 
                  value={selectedBackground} 
                  onValueChange={setSelectedBackground}
                  data-testid="select-room-background"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room background" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomBackgrounds.map(bg => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedBg && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedBg.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: selectedBg.wallColor || '#ffffff' }}
                    />
                    <span className="text-xs text-gray-500">
                      Wall color: {selectedBg.wallColor}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Artworks */}
          <Card data-testid="artwork-library-card">
            <CardHeader className="pb-4">
              <CardTitle>Add Artwork</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 8).map(product => (
                  <button
                    key={product.id}
                    onClick={() => addArtwork(product)}
                    className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                    data-testid={`button-add-artwork-${product.id}`}
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 py-1 bg-blue-500 rounded">
                        Add to Wall
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {products.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No artworks available. Add some products first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Artwork Controls */}
          {selectedProduct && selectedArtworkData && (
            <Card data-testid="artwork-controls-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Artwork Controls</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProduct.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Slider
                    value={[selectedArtworkData.width]}
                    onValueChange={([width]) => {
                      const aspectRatio = selectedArtworkData.height / selectedArtworkData.width;
                      updateArtwork(selectedArtwork!, {
                        width,
                        height: width * aspectRatio,
                      });
                    }}
                    min={50}
                    max={400}
                    step={10}
                    data-testid="slider-artwork-size"
                  />
                  <div className="text-xs text-gray-500">
                    {Math.round(selectedArtworkData.width)} × {Math.round(selectedArtworkData.height)} px
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rotation</Label>
                  <Slider
                    value={[selectedArtworkData.rotation]}
                    onValueChange={([rotation]) => {
                      updateArtwork(selectedArtwork!, { rotation });
                    }}
                    min={-45}
                    max={45}
                    step={1}
                    data-testid="slider-artwork-rotation"
                  />
                  <div className="text-xs text-gray-500">
                    {selectedArtworkData.rotation}°
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetArtwork}
                    data-testid="button-reset-artwork"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArtwork(selectedArtwork!)}
                    data-testid="button-remove-artwork"
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <Card data-testid="simulator-canvas-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Your Art Wall</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearWall}
                    data-testid="button-clear-wall"
                  >
                    Clear Wall
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    data-testid="button-save-simulation"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="max-w-full h-auto cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  data-testid="art-wall-canvas"
                />
                
                {/* Placed Artworks List */}
                {artworks.length > 0 && (
                  <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs">
                    <h4 className="font-medium text-sm mb-2">On Wall ({artworks.length})</h4>
                    <div className="space-y-1">
                      {artworks.map(artwork => {
                        const product = products.find(p => p.id === artwork.productId);
                        return (
                          <div
                            key={artwork.productId}
                            className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer transition-colors ${
                              selectedArtwork === artwork.productId
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setSelectedArtwork(artwork.productId)}
                            data-testid={`artwork-item-${artwork.productId}`}
                          >
                            {product?.images?.[0] && (
                              <img 
                                src={product.images[0]} 
                                alt=""
                                className="w-6 h-6 object-cover rounded"
                              />
                            )}
                            <span className="truncate flex-1">
                              {product?.name || 'Unknown'}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(artwork.width)}px
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Usage Instructions */}
                {artworks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400 space-y-2">
                      <Move className="w-8 h-8 mx-auto opacity-50" />
                      <p className="text-sm font-medium">Click artwork to add to wall</p>
                      <p className="text-xs">Drag to position, use controls to adjust</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}