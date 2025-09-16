import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { StatsGrid } from "@/components/admin/stats-grid";
import { QuickActions } from "@/components/admin/quick-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingCart, MessageSquare } from "lucide-react";
import type { Product, Order, Message } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  // Fetch dynamic content for Live Site Activity and Recent Activity
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products').then(res => res.json()) as Promise<Product[]>
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => fetch('/api/orders').then(res => res.json()) as Promise<Order[]>
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: () => fetch('/api/messages').then(res => res.json()) as Promise<Message[]>
  });

  // Calculate dynamic stats
  const recentProducts = products.slice(0, 3);
  const recentOrders = orders.slice(0, 3);
  const unreadMessages = messages.filter(m => !m.isRead).length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground">Welcome back! Here's what's happening with your art business.</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button data-testid="add-new-product-button">
                  Add New Product
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <StatsGrid />

            {/* Live Site Activity */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Live Site Activity</CardTitle>
                <CardDescription>Real-time data from your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold" data-testid="text-active-products">{products.filter(p => p.status === 'active').length}</div>
                    <div className="text-sm text-muted-foreground">Active Products</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold" data-testid="text-total-revenue">${totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold" data-testid="text-unread-messages">{unreadMessages}</div>
                    <div className="text-sm text-muted-foreground">Unread Messages</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>🆕 Recent Activity</CardTitle>
                  <CardDescription>Latest items from your site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Recent Products</h4>
                    <div className="space-y-2">
                      {recentProducts.length > 0 ? recentProducts.map((product) => (
                        <div key={product.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded" data-testid={`product-${product.id}`}>
                          <span>{product.name}</span>
                          <span className="text-muted-foreground">${product.price}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No products yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Orders</h4>
                    <div className="space-y-2">
                      {recentOrders.length > 0 ? recentOrders.map((order) => (
                        <div key={order.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded" data-testid={`order-${order.id}`}>
                          <span>Order #{order.id.slice(-8)}</span>
                          <span className="text-muted-foreground">${order.totalAmount}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No orders yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
