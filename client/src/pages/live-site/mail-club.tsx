import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, Star, Mail, Gift, Heart, Crown } from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";
import abstractNftImage from "@assets/abstract-nft_1758925017311.png";


// Plan selection component
function PlanCard({ plan, onSelect, isPopular }: {
  plan: SubscriptionPlan;
  onSelect: (planId: string) => void;
  isPopular?: boolean;
}) {
  const getIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'postcard pal':
        return <Mail className="h-8 w-8 text-blue-500" />;
      case 'sticker star':
        return <Star className="h-8 w-8 text-purple-500" />;
      case 'super mail club':
        return <Crown className="h-8 w-8 text-yellow-500" />;
      default:
        return <Gift className="h-8 w-8 text-green-500" />;
    }
  };

  return (
    <Card className={`relative h-full ${isPopular ? 'border-2 border-primary shadow-xl scale-105' : 'border'} transition-all duration-300 hover:shadow-lg`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 font-semibold">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-8 pt-8">
        <div className="mx-auto mb-4">
          {getIcon(plan.name)}
        </div>
        <CardTitle className="text-2xl mb-2" data-testid={`plan-name-${plan.slug}`}>
          {plan.name}
        </CardTitle>
        <div className="text-3xl font-bold text-primary" data-testid={`plan-price-${plan.slug}`}>
          ${plan.price}
          <span className="text-lg font-normal text-muted-foreground">/month</span>
        </div>
        <p className="text-muted-foreground mt-2" data-testid={`plan-description-${plan.slug}`}>
          {plan.description}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <ul className="space-y-3 mb-8">
            {(plan.features || []).map((feature, index) => (
              <li key={index} className="flex items-start gap-3" data-testid={`plan-feature-${plan.slug}-${index}`}>
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Button
          onClick={() => onSelect(plan.id)}
          className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
          size="lg"
          data-testid={`button-select-${plan.slug}`}
        >
          Choose {plan.name}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MailClubPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();
  const { isSignedIn: isAuthenticated } = useUser();

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  // Load subscription plans
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/checkout/subscription', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Checkout session response:", data);
      // Redirect to Stripe checkout
      if (data.url) {
        console.log("Redirecting to:", data.url);
        window.location.href = data.url;
      } else {
        console.error("No URL returned from checkout session");
        toast({
          title: "Subscription Error",
          description: "No checkout URL received. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Checkout session error:", error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to subscribe to Mail Club.",
        variant: "destructive",
      });
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setSelectedPlan(plan);
    createCheckoutMutation.mutate(planId);
  };


  // Filter active plans and sort by display order
  const activePlans = plans
    .filter(plan => plan.status === 'active')
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-[47vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${abstractNftImage})`,
        }}
        data-testid="mail-club-hero-section"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-12 w-12 text-red-400" />
            <Mail className="h-16 w-16 text-blue-400" />
            <Gift className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" data-testid="hero-headline">
            Otto's Mail Club
          </h1>
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl mx-auto" data-testid="hero-description">
            Get exclusive art pieces, postcards, stickers, and behind-the-scenes content delivered to your door every month. 
            Join a community of art lovers and be part of the creative journey.
          </p>
          {!isAuthenticated && (
            <p className="text-lg text-yellow-200 font-semibold" data-testid="login-prompt">
              Please log in to subscribe to Mail Club
            </p>
          )}
        </div>
      </section>

      {/* Subscription Plans */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="plans-heading">
              Choose Your Mail Club Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="plans-subheading">
              Each plan is carefully curated to bring Otto's artistic world directly to your mailbox. 
              Choose the experience that speaks to you.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : activePlans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground" data-testid="no-plans-message">
                Mail Club plans are coming soon! Stay tuned for exciting subscription options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {activePlans.map((plan) => (
                <div key={plan.id} className="flex">
                  <PlanCard 
                    plan={plan} 
                    onSelect={handlePlanSelect}
                    isPopular={plan.isRecommended || false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-12" data-testid="benefits-heading">
              Why Join Mail Club?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4" data-testid="benefit-exclusive">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold">Exclusive Content</h4>
                <p className="text-muted-foreground">
                  Get access to limited-edition pieces and behind-the-scenes content you won't find anywhere else.
                </p>
              </div>
              <div className="space-y-4" data-testid="benefit-monthly">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold">Monthly Surprises</h4>
                <p className="text-muted-foreground">
                  Every package is a curated experience with original art pieces, postcards, and collectibles.
                </p>
              </div>
              <div className="space-y-4" data-testid="benefit-community">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold">Art Community</h4>
                <p className="text-muted-foreground">
                  Connect with fellow art enthusiasts and be part of Otto's creative journey from concept to canvas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}