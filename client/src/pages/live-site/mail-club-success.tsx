import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function MailClubSuccessPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const sessionId = searchParams.get('session_id');
  const { toast } = useToast();

  // Invalidate user subscriptions cache to refresh data
  useEffect(() => {
    if (sessionId) {
      // Refresh user subscriptions to show the new subscription
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscriptions'] });
      
      toast({
        title: "Welcome to Mail Club!",
        description: "Your subscription is active. You'll receive your first package soon!",
      });
    }
  }, [sessionId, toast]);

  // If no session ID, show error state
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader className="pb-6">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-10 w-10 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-red-600">
                  Invalid Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-muted-foreground text-lg mb-2">
                    We couldn't verify your subscription.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please contact support if you believe this is an error.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Link href="/mail-club">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      data-testid="button-back-to-mail-club"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Mail Club
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
                Welcome to Mail Club!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-muted-foreground text-lg mb-2">
                  Your subscription is now active!
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll receive your first Mail Club package soon. We'll send you an email with shipping details and updates about your subscription.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">What's Next?</h3>
                </div>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 text-left">
                  <li>• Check your email for subscription confirmation</li>
                  <li>• Your first package will arrive within 5-7 business days</li>
                  <li>• Manage your subscription anytime in your account</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/account">
                  <Button 
                    className="flex items-center gap-2"
                    data-testid="button-view-account"
                  >
                    <User className="h-4 w-4" />
                    View My Account
                  </Button>
                </Link>
                <Link href="/mail-club">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    data-testid="button-back-to-mail-club"
                  >
                    <Mail className="h-4 w-4" />
                    Back to Mail Club
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