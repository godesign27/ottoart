"use client"

import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"
import { ProductGrid } from "@/components/live-site/product-grid"

export default function AccessoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Accessories</h1>
            <p className="text-muted-foreground mt-2">Art-related accessories and items</p>
          </div>
          <ProductGrid category="Accessories" />
        </div>
      </main>
    </div>
  )
}
