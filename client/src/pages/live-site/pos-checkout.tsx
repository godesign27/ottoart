import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, CheckCircle, QrCode } from "lucide-react";
import type { ArtShow, ArtShowQrCode } from "@shared/schema";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const customerFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
});
type CustomerFormData = z.infer<typeof customerFormSchema>;

type QrCodeWithShow = ArtShowQrCode & { show: ArtShow };

function StripePaymentForm({
  clientSecret,
  amount,
  customerData,
  codeInfo,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  customerData: CustomerFormData;
  codeInfo: QrCodeWithShow;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pos/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({ title: error.message || "Payment failed", variant: "destructive" });
      } else if (paymentIntent?.status === "succeeded") {
        // Send receipt email server-side
        try {
          await apiRequest('POST', '/api/pos/send-receipt', {
            paymentIntentId: paymentIntent.id,
            customerName: customerData.customerName,
            customerEmail: customerData.customerEmail,
            label: codeInfo.label,
            price: codeInfo.price,
            showName: codeInfo.show.name,
            artistName: codeInfo.show.artistName,
          });
        } catch (receiptError) {
          // Receipt failure shouldn't block showing success
          console.error('Receipt email failed:', receiptError);
        }
        onSuccess();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={isProcessing || !stripe}>
        <CreditCard className="h-4 w-4 mr-2" />
        {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function PosCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null);

  const { data: codeInfo, isLoading, error } = useQuery<QrCodeWithShow>({
    queryKey: ['/api/pos', id],
    queryFn: () => apiRequest("GET", `/api/pos/${id}`).then(async (r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { customerName: "", customerEmail: "" },
  });

  const intentMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await apiRequest('POST', `/api/pos/${id}/payment-intent`, data);
      if (!res.ok) throw new Error("Failed to start payment");
      return res.json() as Promise<{ clientSecret: string }>;
    },
    onSuccess: ({ clientSecret }, variables) => {
      setClientSecret(clientSecret);
      setCustomerData(variables);
      setStep("payment");
    },
    onError: () => toast({ title: "Could not start payment. Please try again.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !codeInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium text-foreground">QR code not found</p>
            <p className="text-sm text-muted-foreground mt-1">This link may have expired or be invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = parseFloat(codeInfo.price);

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-10 pb-10 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank you!</h2>
            <p className="text-muted-foreground">
              Your payment of <span className="font-semibold text-foreground">${price.toFixed(2)}</span> was successful.
            </p>
            {customerData?.customerEmail && (
              <p className="text-sm text-muted-foreground mt-2">
                A receipt has been sent to <span className="font-medium">{customerData.customerEmail}</span>.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Artwork from <span className="font-medium">{codeInfo.show.name}</span>
              {codeInfo.show.artistName && <> by <span className="font-medium">{codeInfo.show.artistName}</span></>}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {codeInfo.show.artistName && (
            <p className="text-base font-medium text-foreground mb-0.5">{codeInfo.show.artistName}</p>
          )}
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">{codeInfo.show.name}</p>
          <h1 className="text-3xl font-bold text-foreground">${price.toFixed(2)}</h1>
          <p className="text-muted-foreground mt-1">{codeInfo.label}</p>
          {codeInfo.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{codeInfo.description}</p>
          )}
          {codeInfo.show.location && (
            <p className="text-xs text-muted-foreground mt-1">📍 {codeInfo.show.location}</p>
          )}
        </div>

        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => intentMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" size="lg" disabled={intentMutation.isPending}>
                    {intentMutation.isPending ? "Loading..." : "Continue to Payment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "payment" && clientSecret && customerData && stripePromise && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={price}
                  customerData={customerData}
                  codeInfo={codeInfo}
                  onSuccess={() => setStep("success")}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {step === "payment" && !stripePromise && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Payment is not configured. Please contact the artist.
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Secure payment · Powered by Stripe
        </p>
      </div>
    </div>
  );
}
