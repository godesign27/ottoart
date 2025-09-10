"use client"

import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  currentView: "admin" | "live"
  onViewChange: (view: "admin" | "live") => void
}

export function AdminHeader({ currentView, onViewChange }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border dark:border-gray-700 bg-background dark:bg-gray-900 px-6 flex items-center justify-between w-full">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-foreground dark:text-white">Otto Art</h1>
      </div>

      <div className="flex items-center">
        <div className="flex bg-muted dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={currentView === "admin" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("admin")}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              currentView === "admin"
                ? "bg-background dark:bg-gray-700 text-foreground dark:text-white shadow-sm"
                : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
            }`}
          >
            Studio Admin
          </Button>
          <Button
            variant={currentView === "live" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("live")}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              currentView === "live"
                ? "bg-background dark:bg-gray-700 text-foreground dark:text-white shadow-sm"
                : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
            }`}
          >
            Live Site
          </Button>
        </div>
      </div>
    </header>
  )
}
