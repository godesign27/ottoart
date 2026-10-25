import { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  maxFileSize?: number;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
  multiple?: boolean;
}

async function uploadSingleFile(file: File): Promise<string> {
  const uploadResponse = await fetch("/api/objects/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadURL } = await uploadResponse.json();

  const uploadFileResponse = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadFileResponse.ok) {
    throw new Error("Failed to upload file");
  }

  const finalizeResponse = await fetch("/api/objects/finalize", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageURL: uploadURL,
    }),
  });

  if (!finalizeResponse.ok) {
    throw new Error("Failed to finalize upload");
  }

  const { url } = await finalizeResponse.json();
  return url;
}

export function ImageUploader({
  onImageUploaded,
  maxFileSize = 10 * 1024 * 1024,
  accept = "image/*",
  className = "",
  children,
  multiple = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `"${file.name}" exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`,
          variant: "destructive",
        });
        return false;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `"${file.name}" is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadCount({ done: 0, total: validFiles.length });

    let successCount = 0;
    for (const file of validFiles) {
      try {
        const url = await uploadSingleFile(file);
        onImageUploaded(url);
        successCount++;
        setUploadCount(prev => ({ ...prev, done: prev.done + 1 }));
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: `Failed to upload "${file.name}"`,
          variant: "destructive",
        });
      }
    }

    if (successCount > 0) {
      toast({
        title: "Upload successful",
        description: `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully!`,
      });
    }

    setUploading(false);
    setUploadCount({ done: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [maxFileSize, onImageUploaded, toast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast({
        title: "No images found",
        description: "Please drop image files only",
        variant: "destructive",
      });
      return;
    }
    await processFiles(files);
  }, [processFiles, toast]);

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        multiple={multiple}
        data-testid="input-file"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Uploading {uploadCount.done}/{uploadCount.total}...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {children || "Click or drag images here to upload"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {multiple ? "Multiple files supported" : "Single file"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
