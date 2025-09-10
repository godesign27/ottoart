"use client"

import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"
import { ProductGrid } from "@/components/live-site/product-grid"
import { useState } from "react"
import { BiSearch, BiFilter, BiGrid, BiListUl } from "react-icons/bi"

export default function ShopAllPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Our Products</h1>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-accent">
                <BiFilter />
                Filters
              </button>
              <div className="flex border border-input rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  <BiGrid />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  <BiListUl />
                </button>
              </div>
            </div>
          </div>

          <ProductGrid searchQuery={searchQuery} viewMode={viewMode} />
        </div>
      </main>
    </div>
  )
}
