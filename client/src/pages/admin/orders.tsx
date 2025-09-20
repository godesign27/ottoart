import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Filter, 
  Search, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  User,
  Eye
} from "lucide-react";
import type { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
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

  // Fetch orders data
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    processing: orders.filter((order) => order.status === 'processing').length,
    shipped: orders.filter((order) => order.status === 'shipped').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    cancelled: orders.filter((order) => order.status === 'cancelled').length,
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // Time filter logic
    let matchesTime = true;
    if (timeFilter !== "all" && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      
      switch (timeFilter) {
        case "today": {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          matchesTime = orderDate >= today;
          break;
        }
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = orderDate >= weekAgo;
          break;
        }
        case "month": {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesTime = orderDate >= monthAgo;
          break;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesTime;
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

  const statusCards = [
    { key: 'all', label: 'All Orders', count: statusCounts.all, icon: Package },
    { key: 'pending', label: 'Pending', count: statusCounts.pending, icon: Clock },
    { key: 'processing', label: 'Processing', count: statusCounts.processing, icon: Package },
    { key: 'shipped', label: 'Shipped', count: statusCounts.shipped, icon: Truck },
    { key: 'delivered', label: 'Delivered', count: statusCounts.delivered, icon: CheckCircle },
    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, icon: XCircle },
  ];

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
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and track fulfillment</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="flex items-center gap-2"
          data-testid="refresh-orders"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Orders
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const isActive = statusFilter === card.key;
          const statusColors = card.key === 'all' ? 'bg-gray-500/10 text-gray-500 border-gray-500/20' : getStatusColor(card.key);
          const [bgColor, textColor, borderColor] = statusColors.split(' ');
          
          return (
            <Card 
              key={card.key}
              className={`cursor-pointer transition-colors hover:opacity-80 ${bgColor} ${borderColor} ${
                isActive ? 'ring-2 ring-offset-2 ring-current' : ''
              }`}
              onClick={() => setStatusFilter(card.key)}
              data-testid={`status-card-${card.key}`}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${textColor}`} />
                <div className={`text-2xl font-bold ${textColor}`}>
                  {card.count}
                </div>
                <div className={`text-sm ${textColor}`}>
                  {card.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Filters</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
                data-testid="search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground" data-testid="filter-status">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground" data-testid="filter-time">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here when customers make purchases'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status || 'pending');
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
            return (
              <Card key={order.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt && new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status || 'pending')} border`}>
                      {(order.status || 'pending').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </div>
                      
                      <div className="pl-6">
                        <p className="text-sm text-muted-foreground">Items: {itemCount}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-foreground">${parseFloat(order.totalAmount).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{itemCount} item(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Select 
                        value={order.status || 'pending'} 
                        onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32 h-8 bg-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2" 
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-lg">
                        <SheetHeader>
                          <SheetTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              Order #{order.id.slice(0, 8)}
                            </div>
                            <Badge className={`${getStatusColor(order.status || 'pending')} border uppercase`}>
                              {order.status || 'pending'}
                            </Badge>
                          </SheetTitle>
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt && new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                          {/* Customer Information */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-medium">Customer Information</h3>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shippingAddress && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-medium">Shipping Address</h3>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-4">
                                <div className="text-sm space-y-1">
                                  <p>{order.shippingAddress.street}</p>
                                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                  <p>{order.shippingAddress.country}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Order Items */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-medium">Order Items</h3>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4">
                              {Array.isArray(order.items) && order.items.length > 0 ? (
                                <div className="space-y-3">
                                  {order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-medium">Product ID: {item.productId}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                      </div>
                                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No items found</p>
                              )}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-medium">Order Summary</h3>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping:</span>
                                <span>$0.00</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax:</span>
                                <span>$0.00</span>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex justify-between font-medium">
                                <span>Total:</span>
                                <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Update Status */}
                          <div className="space-y-3">
                            <h3 className="font-medium">Update Status</h3>
                            <Select 
                              value={order.status || 'pending'} 
                              onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-full bg-background border-border text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  </main>
</div>
</div>
  );
}