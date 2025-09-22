import { Calendar, Palette, Award, Ruler, Frame, Package, ShieldCheck } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const detailItems = [
    {
      icon: Calendar,
      label: "Year Created",
      value: product.year ? product.year.toString() : "Not specified"
    },
    {
      icon: Palette,
      label: "Method",
      value: product.medium || "Not specified"
    },
    {
      icon: Award,
      label: "Rarity",
      value: product.rarity || "Not specified"
    },
    {
      icon: Ruler,
      label: "Size",
      value: product.dimensions || "Not specified"
    },
    {
      icon: Frame,
      label: "Frame",
      value: product.frame || "Not specified"
    },
    {
      icon: Package,
      label: "Packaging",
      value: product.packaging || "Not specified"
    },
    {
      icon: ShieldCheck,
      label: "Authenticity",
      value: product.authenticity || "Not specified"
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-foreground text-center mb-8">
          Details and Dimensions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {detailItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className="flex flex-col items-center text-center space-y-3"
                data-testid={`detail-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {item.label}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}