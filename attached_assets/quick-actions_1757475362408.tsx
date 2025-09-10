import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const actions = [
  {
    title: "Add Product",
    description: "Create a new product listing",
    icon: "➕",
    href: "/admin/products/new",
  },
  {
    title: "Upload Images",
    description: "Add new gallery images",
    icon: "📤",
    href: "/admin/pages/gallery",
  },
  {
    title: "Messages",
    description: "View customer messages",
    icon: "💬",
    href: "/admin/messages",
  },
  {
    title: "Settings",
    description: "Configure your store",
    icon: "⚙️",
    href: "/admin/settings/business",
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-gray-100">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 dark:border-gray-600 dark:hover:bg-gray-700 bg-transparent"
            asChild
          >
            <a href={action.href}>
              <span className="text-2xl">{action.icon}</span>
              <div className="text-center">
                <p className="font-medium text-sm dark:text-gray-100">{action.title}</p>
                <p className="text-xs text-muted-foreground dark:text-gray-400">{action.description}</p>
              </div>
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
