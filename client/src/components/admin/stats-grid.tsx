import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, Eye } from "lucide-react";

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      change: "+12% from last month",
      icon: DollarSign,
      color: "green",
      testId: "stat-revenue"
    },
    {
      title: "Total Orders", 
      value: stats?.totalOrders?.toString() || '0',
      change: "+3 new orders",
      icon: ShoppingBag,
      color: "blue",
      testId: "stat-orders"
    },
    {
      title: "Active Products",
      value: stats?.activeProducts?.toString() || '0',
      change: "5 categories",
      icon: Package,
      color: "purple",
      testId: "stat-products"
    },
    {
      title: "Site Visitors",
      value: "1,247",
      change: "+8% this week",
      icon: Eye,
      color: "orange",
      testId: "stat-visitors"
    }
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="stats-card" data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm text-${stat.color}-600`}>{stat.change}</p>
                </div>
                <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/20 rounded-full`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
