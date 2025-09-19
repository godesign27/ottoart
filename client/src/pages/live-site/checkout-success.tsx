import { useEffect } from "react";
import { Link } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Optional: You could fetch order details here if needed
    // For now, we'll just show a success message
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-muted-foreground text-lg mb-2">
                  Thank you for your purchase!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your order has been successfully processed and you should receive a confirmation email shortly.
                  We'll notify you when your artwork ships.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/shop-all">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    data-testid="button-continue-shopping"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    className="flex items-center gap-2"
                    data-testid="button-return-home"
                  >
                    <Home className="h-4 w-4" />
                    Return Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}