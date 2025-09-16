import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Minus, Plus, Trash2, CreditCard, Package } from "lucide-react";
import type { CartItem } from "@shared/schema";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  shippingAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

function PaymentForm({ clientSecret, customerData, onSuccess }: { 
  clientSecret: string, 
  customerData: CheckoutFormData,
  onSuccess: () => void 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full py-3"
        disabled={isProcessing || !stripe || !elements}
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing Payment..." : "Complete Payment"}
      </Button>
    </form>
  );
}

function CheckoutForm({ cartItems, serverAmount }: { cartItems: CartItem[], serverAmount: number }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [customerData, setCustomerData] = useState<CheckoutFormData | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      },
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (formData: CheckoutFormData) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        customerInfo: formData,
        items: cartItems,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep('payment');
    },
    onError: () => {
      toast({
        title: "Payment Setup Failed",
        description: "Unable to setup payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const finalizeOrderMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/orders", {
        customerName: customerData!.customerName,
        customerEmail: customerData!.customerEmail,
        totalAmount: serverAmount.toString(),
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        status: "completed",
        shippingAddress: customerData!.shippingAddress,
      });

      await apiRequest("DELETE", "/api/cart");
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onSuccess: () => {
      toast({
        title: "Order Completed!",
        description: "Your order has been placed successfully.",
      });
      setLocation("/checkout/success");
    },
    onError: () => {
      toast({
        title: "Order Error",
        description: "Payment succeeded but there was an issue creating your order. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handleInfoSubmit = (data: CheckoutFormData) => {
    setCustomerData(data);
    createPaymentIntentMutation.mutate(data);
  };

  const handlePaymentSuccess = () => {
    finalizeOrderMutation.mutate();
  };

  if (step === 'info') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleInfoSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-customer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="shippingAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full py-3"
            disabled={createPaymentIntentMutation.isPending}
            data-testid="button-continue-to-payment"
          >
            {createPaymentIntentMutation.isPending ? "Setting up payment..." : `Continue to Payment - $${serverAmount.toFixed(2)}`}
          </Button>
        </form>
      </Form>
    );
  }

  if (step === 'payment' && clientSecret && customerData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                clientSecret={clientSecret} 
                customerData={customerData}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart']
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update item quantity.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item Removed",
        description: "Item removed from cart successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Remove Failed",
        description: "Could not remove item from cart.",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const totalAmount = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some items to your cart to continue</p>
            <Button onClick={() => setLocation("/shop-all")} data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cart Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Your Order</h2>
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.productName}</h3>
                        {item.tierDisplayName && (
                          <Badge variant="secondary" className="mt-1">
                            {item.tierDisplayName}
                          </Badge>
                        )}
                        <p className="text-lg font-bold mt-2">${item.price}</p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center" data-testid={`quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={updateQuantityMutation.isPending}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="ml-2 text-destructive hover:text-destructive"
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`subtotal-${item.id}`}>
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span data-testid="total-amount">${totalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div>
              {stripePublicKey ? (
                <CheckoutForm cartItems={cartItems} serverAmount={totalAmount} />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">Payment Processing Unavailable</h3>
                    <p className="text-muted-foreground mb-4">
                      Payment processing is currently not configured. Please contact support to complete your order.
                    </p>
                    <Button 
                      onClick={() => setLocation("/contact")} 
                      data-testid="button-contact-support"
                    >
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              )}  
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}