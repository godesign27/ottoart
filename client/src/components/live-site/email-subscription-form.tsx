import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const emailSubscriptionSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type EmailSubscriptionData = z.infer<typeof emailSubscriptionSchema>;

interface EmailSubscriptionFormProps {
  className?: string;
}

export function EmailSubscriptionForm({ className = "" }: EmailSubscriptionFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmailSubscriptionData>({
    resolver: zodResolver(emailSubscriptionSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: EmailSubscriptionData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/newsletter-subscription', data);
      
      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
        toast({
          title: "Success!",
          description: "Thank you for subscribing to our newsletter.",
          variant: "default",
        });
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`space-y-4 ${className}`} role="status">
        <div>
          <h3 className="font-display text-3xl text-foreground">Welcome to our community!</h3>
          <p className="text-muted-foreground">
            You've successfully subscribed to our newsletter. Check your email for confirmation.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsSubmitted(false)}
          data-testid="subscribe-another"
        >
          Subscribe Another Email
        </Button>
      </div>
    );
  }

  return (
    <div className={`grid gap-10 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-5">
        <h2 className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3rem]">Stay connected</h2>
        <p className="mt-4 max-w-md text-lg">
          Subscribe to receive updates about new artworks, exhibitions, and exclusive previews.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:col-span-6 lg:col-start-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John"
                      className="h-12 bg-background"
                      data-testid="input-firstname"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe"
                      className="h-12 bg-background"
                      data-testid="input-lastname"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Email Address *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="h-12 bg-background"
                    data-testid="input-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="h-12 w-full text-base font-semibold sm:w-auto sm:px-8" 
            disabled={isLoading}
            data-testid="button-subscribe"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                Subscribe to the newsletter
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            By subscribing, you agree to receive our newsletter. You can unsubscribe at any time.
          </p>
        </form>
      </Form>
    </div>
  );
}