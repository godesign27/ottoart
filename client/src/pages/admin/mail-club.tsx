import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubscriptionPlanSchema } from "@shared/schema";
import type { SubscriptionPlan, InsertSubscriptionPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Mail, Star, DollarSign, Users } from "lucide-react";
import { z } from "zod";

const formSchema = insertSubscriptionPlanSchema.extend({
  features: z.array(z.string()).default([])
});

export default function AdminMailClub() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString());
  };

  // Handle mobile menu body scroll lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const { data: subscriptionPlans = [], isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: () => fetch('/api/subscription-plans').then(res => res.json()) as Promise<SubscriptionPlan[]>
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: "0.00",
      features: [],
      isRecommended: false,
      status: "active",
      displayOrder: 0,
    },
  });

  // Reset form when editing changes
  useEffect(() => {
    if (editingPlan) {
      form.reset({
        name: editingPlan.name,
        slug: editingPlan.slug,
        description: editingPlan.description,
        price: editingPlan.price,
        features: Array.isArray(editingPlan.features) ? editingPlan.features : [],
        isRecommended: editingPlan.isRecommended,
        status: editingPlan.status || "active",
        displayOrder: editingPlan.displayOrder,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        price: "0.00",
        features: [],
        isRecommended: false,
        status: "active",
        displayOrder: 0,
      });
    }
  }, [editingPlan, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSubscriptionPlan) => {
      return await apiRequest('POST', '/api/subscription-plans', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create subscription plan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSubscriptionPlan> }) => {
      return await apiRequest('PATCH', `/api/subscription-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/subscription-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete subscription plan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const planData = {
      ...values,
      features: values.features || [],
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    if (confirm(`Are you sure you want to delete the "${plan.name}" subscription plan?`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        onNavigate={handleNavigate} 
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <AdminHeader 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange}
          onMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Mail className="h-8 w-8 text-primary" />
                  Mail Club
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage subscription plans for your monthly mail club program
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingPlan(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex items-center gap-2"
                    data-testid="button-add-plan"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPlan ? 'Update the subscription plan details.' : 'Create a new subscription plan for your Mail Club.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plan Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Postcard Pal" 
                                  {...field} 
                                  data-testid="input-plan-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., postcard-pal" 
                                  {...field} 
                                  data-testid="input-plan-slug"
                                />
                              </FormControl>
                              <FormDescription>
                                Used in URLs, should be lowercase and dash-separated
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what this plan includes..."
                                rows={3}
                                {...field}
                                data-testid="input-plan-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="8.00" 
                                    className="pl-9"
                                    {...field}
                                    data-testid="input-plan-price"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="displayOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Order</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  value={field.value || 0}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-plan-order"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="isRecommended"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Recommended
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Show as recommended plan
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-plan-recommended"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingPlan(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                          data-testid="button-save-plan"
                        >
                          {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No subscription plans yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first Mail Club subscription plan to get started.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-plan">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subscriptionPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.isRecommended ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`card-plan-${plan.slug}`}
                  >
                    {plan.isRecommended && (
                      <Badge 
                        className="absolute -top-2 left-4 bg-primary text-primary-foreground"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl" data-testid={`text-plan-name-${plan.slug}`}>
                            {plan.name}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <Badge 
                          variant={plan.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`badge-plan-status-${plan.slug}`}
                        >
                          {plan.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-3xl font-bold mb-4" data-testid={`text-plan-price-${plan.slug}`}>
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      </div>
                      
                      {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Features:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(plan)}
                        className="flex-1"
                        data-testid={`button-edit-${plan.slug}`}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(plan)}
                        data-testid={`button-delete-${plan.slug}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}