import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const activities = [
  {
    type: "order",
    title: "New order received",
    description: "Order #1234 from John Doe",
    time: "2 minutes ago",
    icon: "🛒",
  },
  {
    type: "product",
    title: "Product updated",
    description: "Abstract Canvas #3 stock updated",
    time: "15 minutes ago",
    icon: "📦",
  },
  {
    type: "customer",
    title: "New customer registered",
    description: "Sarah Johnson joined",
    time: "1 hour ago",
    icon: "👥",
  },
  {
    type: "message",
    title: "New message",
    description: "Contact form submission",
    time: "2 hours ago",
    icon: "💬",
  },
]

export function RecentActivity() {
  return (
    <Card className="bg-card dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-gray-100">🕒 Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-gray-700/50">
            <span className="text-lg">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground dark:text-gray-100">{activity.title}</p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">{activity.description}</p>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
