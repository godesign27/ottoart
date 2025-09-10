"use client"

import { Button } from "@/components/ui/button"
import { BiSearch, BiUser } from "react-icons/bi"
import Link from "next/link"
import { useRouter } from "next/navigation"

const getActiveCategories = () => {
  const mockCategories = [
    { id: 1, name: "Originals", showInNavigation: true, order: 1 },
    { id: 2, name: "Prints", showInNavigation: true, order: 2 },
    { id: 3, name: "Accessories", showInNavigation: true, order: 3 },
  ]

  return mockCategories.filter((cat) => cat.showInNavigation).sort((a, b) => a.order - b.order)
}

const getActivePages = () => {
  return [
    { name: "Bio", active: true },
    { name: "CV", active: true },
    { name: "Gallery", active: true },
    { name: "Events", active: true },
    { name: "Contact", active: false }, // Inactive based on the screenshot
  ].filter((page) => page.active)
}

interface LiveSiteNavigationProps {
  currentView?: "admin" | "live"
  onViewChange?: (view: "admin" | "live") => void
}

export function LiveSiteNavigation({ currentView = "live", onViewChange }: LiveSiteNavigationProps) {
  const activeCategories = getActiveCategories()
  const activePages = getActivePages()
  const router = useRouter()

  const handleStudioAdminClick = () => {
    router.push("/admin")
    onViewChange?.("admin")
  }

  return (
    <nav className="h-16 border-b border-border dark:border-gray-700 bg-background dark:bg-gray-900 px-6 flex items-center justify-between w-full">
      <div className="flex items-center space-x-8">
        <Link href="/live-site" className="text-xl font-bold text-foreground dark:text-white">
          Otto Art
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/live-site">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Home
            </Button>
          </Link>

          <Link href="/live-site/shop-all">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground dark:text-gray-200 hover:text-primary dark:hover:text-white"
            >
              Shop all
            </Button>
          </Link>

          {activeCategories.map((category) => (
            <Link key={category.id} href={`/live-site/${category.name.toLowerCase()}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground dark:text-gray-200 hover:text-primary dark:hover:text-white"
              >
                {category.name}
              </Button>
            </Link>
          ))}

          {activePages.map((page) => (
            <Link key={page.name} href={`/live-site/${page.name.toLowerCase()}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground dark:text-gray-200 hover:text-primary dark:hover:text-white"
              >
                {page.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="p-2">
          <BiSearch className="h-4 w-4" />
        </Button>
        <Button variant="default" size="sm">
          Contact
        </Button>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={handleStudioAdminClick}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentView === "admin"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Studio Admin
          </button>
          <button
            onClick={() => onViewChange?.("live")}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentView === "live"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Live Site
          </button>
        </div>

        <Button variant="ghost" size="sm" className="p-2">
          <BiUser className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
