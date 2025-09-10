import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"
import Image from "next/image"

export default function GalleryPage() {
  const galleryImages = [
    { id: 1, title: "Abstract Composition 1", image: "/abstract-colorful-art.png" },
    { id: 2, title: "Urban Rhythms", image: "/modern-abstract-art.png" },
    { id: 3, title: "Color Study", image: "/contemporary-abstract-painting.jpg" },
    { id: 4, title: "Vibrant Forms", image: "/vibrant-abstract-artwork.jpg" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground mt-2">A collection of my recent works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="mt-2 font-medium">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
