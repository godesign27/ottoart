import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Upload, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const commissionFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  commissionType: z.string().min(1, "Please select a commission type"),
  sizePreference: z.string().min(1, "Please select a size preference"),
  budgetRange: z.string().min(1, "Please select a budget range"),
  vision: z.string().min(10, "Please describe your vision (at least 10 characters)").max(1000, "Vision must be less than 1000 characters"),
  preferredContact: z.string().optional(),
  referenceFileUrl: z.string().optional(),
});

type CommissionFormData = z.infer<typeof commissionFormSchema>;

const COMMISSION_TYPES = [
  "Original Artwork",
  "Pet / Animal Portrait",
  "Abstract Commission", 
  "Corporate / Hospitality",
  "Not Sure Yet"
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small (under 24\")" },
  { value: "medium", label: "Medium (24–40\")" },
  { value: "large", label: "Large (40\"+)" },
  { value: "open", label: "Open to recommendation" }
];

const BUDGET_OPTIONS = [
  { value: "under-1000", label: "Under $1,000" },
  { value: "1000-2500", label: "$1,000–$2,500" },
  { value: "2500-5000", label: "$2,500–$5,000" },
  { value: "5000-plus", label: "$5,000+" },
  { value: "not-sure", label: "Not sure yet" }
];

export default function CommissionPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const form = useForm<CommissionFormData>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      commissionType: "",
      sizePreference: "",
      budgetRange: "",
      vision: "",
      preferredContact: "email",
      referenceFileUrl: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: CommissionFormData) => {
      const response = await apiRequest("POST", "/api/commissions", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommissionFormData) => {
    submitMutation.mutate(data);
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    form.reset();
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="bg-background min-h-[70vh] flex items-center justify-center px-4 py-12">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">Thanks!</h2>
              <p className="text-muted-foreground mb-8">
                I'll reply within 48 hours.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/">
                  <Button className="w-full" size="lg" data-testid="button-view-work">
                    View my work
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubmitAnother}
                  data-testid="button-submit-another"
                >
                  Submit another
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="bg-background px-4 py-8 md:py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Commission Request
            </h1>
            <p className="text-muted-foreground text-lg">
              Quick form — submitting doesn't commit you to anything. It just starts the conversation.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Your name"
                        className="h-12 text-base"
                        data-testid="input-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Email *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="you@email.com"
                        className="h-12 text-base"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Phone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="h-12 text-base"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Preferred Contact Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="contact-email" className="h-5 w-5" />
                          <Label htmlFor="contact-email" className="text-base cursor-pointer">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="contact-text" className="h-5 w-5" />
                          <Label htmlFor="contact-text" className="text-base cursor-pointer">Text</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Commission Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {COMMISSION_TYPES.map((type) => (
                          <div key={type} className="flex items-center space-x-3">
                            <RadioGroupItem 
                              value={type} 
                              id={type.replace(/\s+/g, '-').toLowerCase()}
                              className="h-5 w-5"
                              data-testid={`radio-commission-${type.replace(/\s+/g, '-').toLowerCase()}`}
                            />
                            <Label 
                              htmlFor={type.replace(/\s+/g, '-').toLowerCase()}
                              className="text-base cursor-pointer"
                            >
                              {type}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sizePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Size Preference *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base" data-testid="select-size">
                          <SelectValue placeholder="Select a size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SIZE_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-base"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Budget Range *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base" data-testid="select-budget">
                          <SelectValue placeholder="Select your budget" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-base"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Your Vision *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Tell me about what you're imagining — colors, mood, style, where it will hang..."
                        className="min-h-[120px] text-base resize-none"
                        data-testid="textarea-vision"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 pb-8">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-commission"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
