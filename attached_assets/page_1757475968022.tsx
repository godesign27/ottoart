"use client"

import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"
import { ProductGrid } from "@/components/live-site/product-grid"

export default function PrintsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Prints</h1>
            <p className="text-muted-foreground mt-2">Digital and physical prints</p>
          </div>
          <ProductGrid category="Art Prints" />
        </div>
      </main>
    </div>
  )
}
