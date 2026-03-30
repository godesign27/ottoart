import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Printer, ChevronsUpDown, Check, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@shared/schema";

type SiteSetting = { key: string; value: any };

function CertificatePreview({
  artistName,
  artworkTitle,
  medium,
  dimensions,
  year,
  edition,
  buyerName,
  saleDate,
  certNumber,
  printRef,
}: {
  artistName: string;
  artworkTitle: string;
  medium: string;
  dimensions: string;
  year: string;
  edition: string;
  buyerName: string;
  saleDate: string;
  certNumber: string;
  printRef: React.RefObject<HTMLDivElement>;
}) {
  const formattedDate = saleDate
    ? new Date(saleDate + "T12:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div
      ref={printRef}
      style={{
        width: "680px",
        minHeight: "920px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "64px 72px",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#111827",
        position: "relative",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      {/* Outer decorative border */}
      <div
        style={{
          position: "absolute",
          inset: "18px",
          border: "1.5px solid #d1c7b4",
          borderRadius: "4px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "24px",
          border: "0.5px solid #e9e3d8",
          borderRadius: "2px",
          pointerEvents: "none",
        }}
      />

      {/* Header ornament */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ letterSpacing: "0.35em", fontSize: "10px", textTransform: "uppercase", color: "#9ca3af", marginBottom: "18px" }}>
          Otto Art
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "18px" }}>
          <div style={{ height: "1px", width: "60px", background: "#d1c7b4" }} />
          <div style={{ color: "#c9b99a", fontSize: "18px" }}>✦</div>
          <div style={{ height: "1px", width: "60px", background: "#d1c7b4" }} />
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "normal",
            letterSpacing: "0.08em",
            color: "#1f2937",
            margin: "0 0 6px",
          }}
        >
          Certificate of Authenticity
        </h1>
        <div style={{ height: "1px", background: "#d1c7b4", margin: "18px auto 0", width: "200px" }} />
      </div>

      {/* Certification statement */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.8", margin: 0 }}>
          This document certifies that the work described below is an original creation
          {artistName ? ` by ${artistName}` : ""} and is genuine and authentic.
        </p>
      </div>

      {/* Artwork details */}
      <div
        style={{
          background: "#faf9f7",
          border: "1px solid #e9e3d8",
          borderRadius: "4px",
          padding: "28px 32px",
          marginBottom: "32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#111827", marginBottom: "4px" }}>
            {artworkTitle || <span style={{ color: "#d1d5db", fontStyle: "italic" }}>Artwork Title</span>}
          </div>
          {artistName && (
            <div style={{ fontSize: "13px", color: "#9ca3af", letterSpacing: "0.05em" }}>
              by {artistName}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
          <DetailRow label="Medium" value={medium} placeholder="Not specified" />
          <DetailRow label="Dimensions" value={dimensions} placeholder="Not specified" />
          <DetailRow label="Year" value={year} placeholder="Not specified" />
          <DetailRow label="Edition" value={edition} placeholder="Original" />
        </div>
      </div>

      {/* Purchase info */}
      {(buyerName || saleDate || certNumber) && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 24px" }}>
            {buyerName && <DetailRow label="Acquired by" value={buyerName} />}
            {formattedDate && <DetailRow label="Date" value={formattedDate} />}
            {certNumber && <DetailRow label="Certificate No." value={certNumber} />}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "auto", paddingTop: "32px" }}>
        <div>
          <div style={{ borderTop: "1px solid #6b7280", paddingTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Artist Signature
            </div>
            {artistName && (
              <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>{artistName}</div>
            )}
          </div>
        </div>
        <div>
          <div style={{ borderTop: "1px solid #6b7280", paddingTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Date
            </div>
            <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
              {formattedDate || "\u00a0"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "10px" }}>
          <div style={{ height: "1px", width: "40px", background: "#e9e3d8" }} />
          <div style={{ color: "#d1c7b4", fontSize: "12px" }}>✦</div>
          <div style={{ height: "1px", width: "40px", background: "#e9e3d8" }} />
        </div>
        <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          ottoart.app
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string | number;
  placeholder?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", color: value ? "#1f2937" : "#d1d5db", fontStyle: value ? "normal" : "italic" }}>
        {value || placeholder || "\u00a0"}
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [certNumber, setCertNumber] = useState(
    `OA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const printRef = useRef<HTMLDivElement>(null);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: siteSettings = [] } = useQuery<SiteSetting[]>({ queryKey: ["/api/site-settings"] });

  const artistSetting = siteSettings.find((s: SiteSetting) => s.key === "artist");
  const artistName: string =
    (artistSetting?.value as any)?.name || "Otto";

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setOpen(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=800,height=1050");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Authenticity — ${selectedProduct?.name || "Artwork"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; display: flex; justify-content: center; padding: 32px; }
            @media print {
              body { padding: 0; }
              @page { size: letter portrait; margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const artworkTitle = selectedProduct?.name || "";
  const medium = selectedProduct?.medium || "";
  const dimensions = selectedProduct?.dimensions || "";
  const year = selectedProduct?.year ? String(selectedProduct.year) : "";
  const edition = selectedProduct?.rarity || "";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificate of Authenticity</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate a printable certificate for any artwork.
          </p>
        </div>
        <Button onClick={handlePrint} disabled={!selectedProduct} size="lg">
          <Printer className="h-4 w-4 mr-2" />
          Print Certificate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        {/* Left: form */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Artwork
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Select Product</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between font-normal"
                    >
                      {selectedProduct ? selectedProduct.name : "Choose an artwork…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search products…" />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                          {products.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => handleProductSelect(p)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProduct?.id === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-2 gap-3 text-sm border rounded-md p-3 bg-muted/30">
                  {medium && (
                    <div>
                      <p className="text-xs text-muted-foreground">Medium</p>
                      <p className="font-medium truncate">{medium}</p>
                    </div>
                  )}
                  {dimensions && (
                    <div>
                      <p className="text-xs text-muted-foreground">Dimensions</p>
                      <p className="font-medium truncate">{dimensions}</p>
                    </div>
                  )}
                  {year && (
                    <div>
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="font-medium">{year}</p>
                    </div>
                  )}
                  {edition && (
                    <div>
                      <p className="text-xs text-muted-foreground">Edition</p>
                      <p className="font-medium truncate">{edition}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="buyer">Buyer Name</Label>
                <Input
                  id="buyer"
                  placeholder="e.g. Jane Smith"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Sale Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cert">Certificate Number</Label>
                <Input
                  id="cert"
                  placeholder="e.g. OA-2025-0042"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {!selectedProduct && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
              <Award className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Select an artwork to preview the certificate. You can then print or save it as a PDF.</p>
            </div>
          )}
        </div>

        {/* Right: certificate preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Preview</div>
          <div style={{ transform: "scale(0.82)", transformOrigin: "top center", marginBottom: "-140px" }}>
            <CertificatePreview
              artistName={artistName}
              artworkTitle={artworkTitle}
              medium={medium}
              dimensions={dimensions}
              year={year}
              edition={edition}
              buyerName={buyerName}
              saleDate={saleDate}
              certNumber={certNumber}
              printRef={printRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
