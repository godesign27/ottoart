import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BiShoppingBag, BiDollar, BiPackage, BiGroup, BiMessage, BiTrendingUp } from "react-icons/bi"

const stats = [
  {
    title: "Total Orders",
    value: "3",
    change: "+12% this month",
    icon: BiShoppingBag,
  },
  {
    title: "Revenue",
    value: "$1409.95",
    change: "+8% this month",
    icon: BiDollar,
  },
  {
    title: "Products",
    value: "5",
    change: "5 active",
    icon: BiPackage,
  },
  {
    title: "Customers",
    value: "4",
    change: "+3 this week",
    icon: BiGroup,
  },
  {
    title: "Messages",
    value: "5",
    change: "2 unread",
    icon: BiMessage,
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    change: "+0.5% this week",
    icon: BiTrendingUp,
  },
  {
    title: "Average Order",
    value: "$469.98",
    change: "Above average",
    icon: BiDollar,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`bg-card dark:bg-gray-800 dark:border-gray-700 ${index >= 4 ? "lg:col-span-1" : ""}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-lg text-gray-600 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-gray-100 mb-1">{stat.value}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-500">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
