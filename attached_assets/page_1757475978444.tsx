"use client"

import { ProductGrid } from "@/components/live-site/product-grid"
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"

export default function OriginalsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Originals</h1>
            <p className="text-muted-foreground mt-2">Original paintings and canvas works</p>
          </div>
          <ProductGrid category="Originals" />
        </div>
      </main>
    </div>
  )
}
