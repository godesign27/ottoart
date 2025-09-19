import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageModalProps {
  images: string[];
  initialImageIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export function ProductImageModal({ 
  images, 
  initialImageIndex = 0, 
  isOpen, 
  onClose, 
  productName 
}: ProductImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(initialImageIndex);
    }
  }, [isOpen, initialImageIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore auto-repeat events to prevent rapid cycling
      if (event.repeat) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] w-full p-0 bg-transparent border-none shadow-none"
        data-testid="image-modal-overlay"
      >
        <div className="relative w-full h-full">
          {/* Close button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={onClose}
            data-testid="close-modal-button"
            aria-label="Close image gallery"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Navigation buttons (only show if multiple images) */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={goToPrevious}
                data-testid="previous-image-button"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={goToNext}
                data-testid="next-image-button"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Main image */}
          <div className="relative">
            <img
              src={images[currentImageIndex]}
              alt={`${productName} - Image ${currentImageIndex + 1} of ${images.length}`}
              className="w-full h-full max-h-[90vh] object-contain rounded-lg"
              data-testid={`modal-image-${currentImageIndex}`}
            />
            
            {/* Image counter (only show if multiple images) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail navigation (only show if multiple images) */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 max-w-full overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-white' 
                      : 'border-white/30 hover:border-white/60'
                  }`}
                  data-testid={`thumbnail-${index}`}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                >
                  <img
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}