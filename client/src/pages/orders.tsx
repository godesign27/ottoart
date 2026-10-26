import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  ShoppingBag,
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react";
import type { Order } from "@shared/schema";
import { useUser } from "@clerk/react";
import { Link } from "wouter";

export default function UserOrders() {
  const { user, isSignedIn: isAuthenticated } = useUser();

  // Fetch user's orders
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Package;
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="text-2xl">Sign in to view your orders</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please sign in to access your order history and track your purchases.
              </p>
              <Button asChild data-testid="button-sign-in">
                <a href="/sign-in">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-orders-title">My Orders</h1>
            <p className="text-muted-foreground mt-2">
              View and track your order history
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          )}

          {error && <p role="alert">Unable to load orders: {error.message}</p>}
          {/* Empty state */}
          {!error && !isLoading && orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-6">
                  When you place an order, it will appear here.
                </p>
                <Button asChild data-testid="button-shop">
                  <Link href="/shop-all">Start Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Orders list */}
          {!isLoading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = getStatusIcon(order.status || 'pending');
                
                return (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <Badge 
                          className={`${getStatusColor(order.status || 'pending')} border w-fit flex items-center gap-1.5 px-3 py-1`}
                          data-testid={`badge-status-${order.id}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <Separator />
                    
                    <CardContent className="pt-6 space-y-4">
                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Items ({order.items?.length || 0})
                        </h3>
                        <div className="space-y-2">
                          {order.items?.map((item: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-lg"
                              data-testid={`item-${order.id}-${index}`}
                            >
                              <div className="flex-1">
                                <p className="font-medium">Item #{item.productId?.slice(0, 8)}</p>
                                <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                              </div>
                              <p className="font-semibold">${parseFloat(item.price || '0').toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </h3>
                          <div className="text-sm bg-muted/50 p-3 rounded-lg space-y-1">
                            <p>{order.shippingAddress.street}</p>
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>
                      )}

                      {/* Order Total */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total
                        </span>
                        <span className="text-xl font-bold" data-testid={`text-total-${order.id}`}>
                          ${parseFloat(order.totalAmount || '0').toFixed(2)}
                        </span>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Note:</span> {order.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
