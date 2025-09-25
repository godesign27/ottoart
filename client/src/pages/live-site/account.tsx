import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Mail, Crown, Star, Gift, Heart, ShoppingBag, Calendar, DollarSign, X } from "lucide-react";
import type { UserSubscription, SubscriptionPlan } from "@shared/schema";

// Extended type to include plan details
interface SubscriptionWithPlan extends UserSubscription {
  plan?: SubscriptionPlan;
}

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery<SubscriptionWithPlan[]>({
    queryKey: ['/api/user-subscriptions'],
    enabled: isAuthenticated,
  });

  // Fetch all subscription plans to get plan details
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (userSubscriptionId: string) => {
      const response = await apiRequest('POST', `/api/cancel-subscription/${userSubscriptionId}`, {});
      return response.json();
    },
    onSuccess: (data, userSubscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
      toast({
        title: "Subscription Cancelled",
        description: `Your subscription will end on ${new Date(data.cancelAt).toLocaleDateString()}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'past_due':
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'postcard pal':
        return <Mail className="h-6 w-6 text-blue-500" />;
      case 'sticker star':
        return <Star className="h-6 w-6 text-purple-500" />;
      case 'super mail club':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      default:
        return <Gift className="h-6 w-6 text-green-500" />;
    }
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    cancelSubscriptionMutation.mutate(subscriptionId);
  };

  // Map subscriptions with plan details
  const subscriptionsWithPlans = subscriptions.map(sub => {
    const plan = plans.find(p => p.id === sub.planId);
    return { ...sub, plan };
  });

  const isLoading = authLoading || subscriptionsLoading;

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">My Account</h1>
            <p className="text-muted-foreground mb-8">Please log in to view your account details</p>
            <Button onClick={() => setLocation('/api/auth/login')} data-testid="login-button">
              Log In
            </Button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-2">Manage your subscriptions and account settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="account-title">My Account</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {(user as any)?.firstName || (user as any)?.email || 'there'}!
          </p>
        </div>

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <Mail className="h-4 w-4 mr-2" />
              Mail Club
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" data-testid="subscriptions-heading">Mail Club Subscriptions</h2>
                <Button 
                  onClick={() => setLocation('/mail-club')} 
                  variant="outline"
                  data-testid="button-browse-plans"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Browse Plans
                </Button>
              </div>

              {subscriptionsError && (
                <Card className="border-destructive/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Failed to load subscriptions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        There was an error loading your subscription information.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] })}
                        data-testid="button-retry-subscriptions"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!subscriptionsError && subscriptionsWithPlans.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-medium mb-2" data-testid="no-subscriptions-title">No subscriptions yet</h3>
                      <p className="text-muted-foreground mb-6" data-testid="no-subscriptions-description">
                        Join Mail Club to receive exclusive art pieces, postcards, and behind-the-scenes content delivered monthly.
                      </p>
                      <Button onClick={() => setLocation('/mail-club')} data-testid="button-join-mail-club">
                        <Gift className="h-4 w-4 mr-2" />
                        Join Mail Club
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {subscriptionsWithPlans.map((subscription) => (
                <Card key={subscription.id} className="overflow-hidden" data-testid={`subscription-card-${subscription.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getPlanIcon(subscription.plan?.name || '')}
                        <div>
                          <CardTitle className="text-xl" data-testid={`subscription-name-${subscription.id}`}>
                            {subscription.plan?.name || 'Unknown Plan'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`subscription-description-${subscription.id}`}>
                            {subscription.plan?.description}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(subscription.status)} data-testid={`subscription-status-${subscription.id}`}>
                        {subscription.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2" data-testid={`subscription-price-${subscription.id}`}>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          ${subscription.plan?.price}/month
                        </span>
                      </div>
                      
                      {subscription.currentPeriodEnd && (
                        <div className="flex items-center gap-2" data-testid={`subscription-next-billing-${subscription.id}`}>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {subscription.plan?.features && subscription.plan.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Included:</p>
                        <div className="flex flex-wrap gap-1">
                          {subscription.plan.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs" data-testid={`subscription-feature-${subscription.id}-${index}`}>
                              {feature}
                            </Badge>
                          ))}
                          {subscription.plan.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{subscription.plan.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        {subscription.cancelAtPeriodEnd ? (
                          <span>Subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}</span>
                        ) : subscription.status === 'active' ? (
                          <span>Active subscription</span>
                        ) : subscription.status === 'pending' ? (
                          <span>Payment processing...</span>
                        ) : (
                          <span>Subscription {subscription.status}</span>
                        )}
                      </div>
                      
                      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-cancel-${subscription.id}`}
                            >
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your {subscription.plan?.name} subscription? 
                                You'll continue to receive benefits until the end of your current billing period.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={cancelSubscriptionMutation.isPending}
                                data-testid={`button-confirm-cancel-${subscription.id}`}
                              >
                                {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Your Favorites</h3>
                  <p className="text-muted-foreground mb-6">
                    View and manage your favorite artwork pieces.
                  </p>
                  <Button onClick={() => setLocation('/favorites')} data-testid="button-view-favorites">
                    <Heart className="h-4 w-4 mr-2" />
                    View Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Order History</h3>
                  <p className="text-muted-foreground mb-6">
                    Your purchase history and order tracking will appear here.
                  </p>
                  <Button onClick={() => setLocation('/shop-all')} variant="outline" data-testid="button-browse-shop">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Shop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}