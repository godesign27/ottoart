import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Package, MessageCircle, User } from "lucide-react";

export function RecentActivity() {
  const { data: messages } = useQuery({
    queryKey: ['/api/messages'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Mock recent activity combining real data with mock events
  const activities = [
    {
      type: "order",
      title: "New order received",
      description: "Order #1847 from Sarah Johnson - $450.00",
      time: "2 minutes ago",
      icon: ShoppingBag,
      color: "green"
    },
    {
      type: "product",
      title: "Product updated",
      description: "Abstract Waves stock updated to 3 units",
      time: "15 minutes ago", 
      icon: Package,
      color: "blue"
    },
    {
      type: "customer",
      title: "New customer registered",
      description: "Sarah Johnson joined",
      time: "1 hour ago",
      icon: User,
      color: "purple"
    },
    {
      type: "message",
      title: "New message",
      description: "Contact form submission from gallery visitor",
      time: "2 hours ago",
      icon: MessageCircle,
      color: "orange"
    }
  ];

  return (
    <Card className="lg:col-span-2 bg-card border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div 
              key={index} 
              className="flex items-start space-x-4"
              data-testid={`activity-${activity.type}-${index}`}
            >
              <div className={`p-2 bg-${activity.color}-100 dark:bg-${activity.color}-900/20 rounded-full`}>
                <Icon className={`h-4 w-4 text-${activity.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
