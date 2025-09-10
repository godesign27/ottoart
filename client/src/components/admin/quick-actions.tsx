import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, MessageCircle } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Add Product",
      description: "Create new artwork listing",
      icon: Plus,
      onClick: () => console.log("Add product"),
      testId: "action-add-product"
    },
    {
      title: "Upload Images",
      description: "Add to gallery",
      icon: Upload,
      onClick: () => console.log("Upload images"),
      testId: "action-upload-images"
    },
    {
      title: "View Messages",
      description: "3 unread",
      icon: MessageCircle,
      onClick: () => console.log("View messages"),
      testId: "action-view-messages"
    }
  ];

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full p-4 h-auto justify-start border border-border hover:bg-accent transition-colors"
              onClick={action.onClick}
              data-testid={action.testId}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
