"use client"

import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { BiChevronLeft, BiStar, BiBox, BiShield, BiRefresh, BiShoppingBag } from "react-icons/bi"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sku: string
  status: string
  featured: boolean
  stock: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    // Mock product data - in real app this would come from API
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Abstract 01",
        description: "Abstract art description here.",
        price: 1500,
        image: "/abstract-colorful-art.png",
        category: "Artwork",
        sku: "abstract-01",
        status: "Active",
        featured: true,
        stock: 10,
      },
      {
        id: "2",
        name: "Abstract 02",
        description: "Contemporary abstract painting with vibrant colors.",
        price: 60,
        image: "/modern-abstract-art.png",
        category: "Art Prints",
        sku: "abstract-02",
        status: "Active",
        featured: false,
        stock: 25,
      },
      {
        id: "3",
        name: "Abstract 03",
        description: "Test description",
        price: 150,
        image: "/contemporary-abstract-painting.jpg",
        category: "Artwork",
        sku: "abstract-03",
        status: "Active",
        featured: true,
        stock: 5,
      },
      {
        id: "4",
        name: "Abstract 04",
        description: "Vibrant abstract artwork with bold strokes.",
        price: 200,
        image: "/vibrant-abstract-artwork.jpg",
        category: "Art Prints",
        sku: "abstract-04",
        status: "Active",
        featured: false,
        stock: 15,
      },
      {
        id: "5",
        name: "Chicago Bandana",
        description: "Premium Chicago-themed bandana.",
        price: 10,
        image: "/chicago-bandana.jpg",
        category: "Accessories",
        sku: "CHI-BAND-001",
        status: "Active",
        featured: false,
        stock: 100,
      },
    ]

    const foundProduct = mockProducts.find((p) => p.id === params.id)
    setProduct(foundProduct || null)
  }, [params.id])

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BiChevronLeft />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  {product.featured && <BiStar className="text-yellow-500 w-6 h-6" />}
                </div>
                <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
              </div>

              <p className="text-lg">{product.description}</p>

              <p className="text-sm text-muted-foreground">{product.stock} in stock</p>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                <BiShoppingBag />
                Add 1 to Cart
              </button>

              {/* Features */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <BiBox className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BiShield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">Your payment information is safe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BiRefresh className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
