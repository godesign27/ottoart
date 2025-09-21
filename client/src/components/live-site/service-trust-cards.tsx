import { Truck, Shield, Award } from "lucide-react";

export function ServiceTrustCards() {
  const cards = [
    {
      icon: Truck,
      title: "Shipping & Delivery",
      content: "Free US delivery for qualifying orders. Your artwork is hand-packed with care and shipped in professional packaging. Every order comes with a tracking number emailed directly to you for peace of mind.\n\nUS delivery: within 14 days\nInternational delivery: 14–28 days"
    },
    {
      icon: Shield,
      title: "Secure Checkout",
      content: "Shop with Confidence. Your payment details are safeguarded by bank-level encryption throughout the checkout process. We accept all major credit cards, plus modern options like Link and Amazon Pay, so you can choose the method that works best for you."
    },
    {
      icon: Award,
      title: "Certificate of Authenticity",
      content: "Every original artwork includes a signed certificate guaranteeing authenticity and providing full provenance details."
    }
  ];

  return (
    <div className="bg-muted/50 border-b border-border">
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