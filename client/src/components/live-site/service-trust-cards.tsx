import { Truck, Shield, Award } from "lucide-react";

export function ServiceTrustCards() {
  const cards = [
    {
      icon: Truck,
      title: "Shipping & Delivery",
      content: "Free delivery worldwide. Professional packaging with tracking number provided for safe transit of your artwork."
    },
    {
      icon: Shield,
      title: "Secure Checkout",
      content: "Your payment information is protected with bank-level security. Shop with confidence using our encrypted checkout process."
    },
    {
      icon: Award,
      title: "Certificate of Authenticity",
      content: "Every original artwork includes a signed certificate guaranteeing authenticity and providing full provenance details."
    }
  ];

  return (
    <div className="bg-muted/20 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div 
                key={index} 
                className="text-center space-y-4 p-6 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-colors"
                data-testid={`service-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.content}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}