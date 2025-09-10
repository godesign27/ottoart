import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ImageUploader({
  onImageUploaded,
  maxFiles = 1,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  accept = "image/*",
  className = "",
  children,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Get upload URL from backend
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

      // Upload file to object storage
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

      // Finalize upload by setting ACL policy
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

      // Call the callback with the uploaded image URL
      onImageUploaded(url);

      toast({
        title: "Upload successful",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      
      // Clear preview on error
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        data-testid="input-file"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
            data-testid="img-preview"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearPreview}
            disabled={uploading}
            data-testid="button-clear-preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
        data-testid="button-upload"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {children || "Upload Image"}
          </>
        )}
      </Button>
    </div>
  );
}