import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  RefreshCw, 
  Filter, 
  Search, 
  UserCheck, 
  Mail,
  Calendar,
  DollarSign,
  Users
} from "lucide-react";
import type { UserSubscription, SubscriptionPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'incomplete':
      return 'destructive';
    case 'canceled':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'incomplete':
      return 'text-red-600';
    case 'canceled':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

export default function AdminSubscriptions() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
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

  // Load subscriptions and plans data
  const { data: subscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery<UserSubscription[]>({
    queryKey: ['/api/user-subscriptions/all'],
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Create a map for plan lookups
  const plansMap = plans.reduce((acc, plan) => {
    acc[plan.id] = plan;
    return acc;
  }, {} as Record<string, SubscriptionPlan>);

  // Filter subscriptions based on search and filters
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const plan = plansMap[subscription.planId];
    const searchTerm = searchQuery.toLowerCase();
    
    const matchesSearch = searchTerm === "" || 
      subscription.userEmail?.toLowerCase().includes(searchTerm) ||
      plan?.name.toLowerCase().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    const matchesPlan = planFilter === "all" || subscription.planId === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Stats calculations
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    canceled: subscriptions.filter(s => s.status === 'canceled').length,
    revenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((total, sub) => {
        const plan = plansMap[sub.planId];
        return total + (plan ? plan.price : 0);
      }, 0)
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        onNavigate={handleNavigate}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <AdminHeader 
          title="Mail Club Subscriptions"
          onMobileMenuToggle={handleMobileMenuToggle}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-active">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Canceled</CardTitle>
                <Mail className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600" data-testid="stat-canceled">{stats.canceled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-revenue">{formatPrice(stats.revenue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by email or plan name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="search-subscriptions"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="filter-status">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="filter-plan">
                    <Mail className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => refetchSubscriptions()}
                  disabled={subscriptionsLoading}
                  data-testid="refresh-subscriptions"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${subscriptionsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions ({filteredSubscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {subscriptionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || planFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "No one has subscribed to Mail Club yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Stripe ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => {
                        const plan = plansMap[subscription.planId];
                        return (
                          <TableRow key={subscription.id} data-testid={`subscription-row-${subscription.id}`}>
                            <TableCell>
                              <div className="font-medium">{subscription.userEmail}</div>
                              <div className="text-sm text-muted-foreground">ID: {subscription.userId}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{plan?.name || 'Unknown Plan'}</div>
                              <div className="text-sm text-muted-foreground">{plan?.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={getStatusBadgeVariant(subscription.status)}
                                className={getStatusColor(subscription.status)}
                              >
                                {subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{plan ? formatPrice(plan.price) : 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">per month</div>
                            </TableCell>
                            <TableCell>
                              {subscription.startDate ? formatDate(subscription.startDate) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-mono">{subscription.stripeSubscriptionId || 'N/A'}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}