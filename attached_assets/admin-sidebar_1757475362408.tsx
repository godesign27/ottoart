"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { BiBarChart, BiStore, BiFile, BiCog, BiMoon, BiChevronRight, BiPlus } from "react-icons/bi"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: BiBarChart,
  },
  {
    title: "Storefront",
    icon: BiStore,
    children: [
      { title: "Product listings", href: "/admin/products" },
      { title: "Product page", href: "/admin/product-page" },
      { title: "Categories and tags", href: "/admin/categories" },
    ],
  },
  {
    title: "Pages",
    icon: BiFile,
    children: [
      { title: "Bio", href: "/admin/pages/bio", toggle: true, enabled: true },
      { title: "CV", href: "/admin/pages/cv", toggle: true, enabled: true },
      { title: "Gallery", href: "/admin/pages/gallery", toggle: true, enabled: true },
      { title: "Events", href: "/admin/pages/events", toggle: true, enabled: true },
      { title: "Contact", href: "/admin/pages/contact", toggle: true, enabled: false },
    ],
  },
  {
    title: "Site Settings",
    icon: BiCog,
    children: [
      { title: "Business Information", href: "/admin/settings/business" },
      { title: "Theme", href: "/admin/settings/theme" },
      { title: "Social Media", href: "/admin/settings/social" },
      { title: "Artist Account", href: "/admin/settings/artist" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Storefront", "Pages"])
  const [pageToggles, setPageToggles] = useState({
    bio: true,
    cv: true,
    gallery: true,
    events: true,
    contact: false,
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem("color-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove("dark")
      setIsDarkMode(false)
    }
  }, [])

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("color-theme", "light")
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("color-theme", "dark")
      setIsDarkMode(true)
    }
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const togglePage = (pageKey: string) => {
    setPageToggles((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey as keyof typeof pageToggles],
    }))
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/professional-artist-portrait.png" alt="Otto Art" />
            <AvatarFallback className="bg-primary-600 text-white">OA</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Otto Art</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                    expandedItems.includes(item.title) && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <item.icon className="mr-3 text-lg" />
                  {item.title}
                  <BiChevronRight
                    className={cn("ml-auto transition-transform", expandedItems.includes(item.title) && "rotate-90")}
                  />
                </Button>
                {expandedItems.includes(item.title) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <div key={child.title} className="flex items-center justify-between">
                        <Link
                          href={child.href}
                          className={cn(
                            "flex-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                            pathname === child.href && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                          )}
                        >
                          {child.title}
                        </Link>
                        {child.toggle && (
                          <Switch
                            checked={pageToggles[child.title.toLowerCase() as keyof typeof pageToggles]}
                            onCheckedChange={() => togglePage(child.title.toLowerCase())}
                            className="ml-2"
                          />
                        )}
                      </div>
                    ))}
                    {item.title === "Pages" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white mt-2"
                      >
                        <BiPlus className="mr-2" />
                        Add Page
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                    pathname === item.href && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                  )}
                >
                  <item.icon className="mr-3 text-lg" />
                  {item.title}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BiMoon className="text-gray-600 dark:text-gray-300" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Dark Mode</span>
          </div>
          <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>© 2021 Flowbite. All rights reserved.</p>
        <div className="flex space-x-4">
          <Link href="#" className="hover:text-gray-700 dark:hover:text-gray-200">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-gray-700 dark:hover:text-gray-200">
            API
          </Link>
          <Link href="#" className="hover:text-gray-700 dark:hover:text-gray-200">
            Contact
          </Link>
        </div>
      </div>
    </div>
  )
}
