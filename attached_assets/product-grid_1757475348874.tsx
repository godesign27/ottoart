"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { BiStar } from "react-icons/bi"

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

interface ProductGridProps {
  category?: string
  searchQuery?: string
  viewMode?: "grid" | "list"
}

export function ProductGrid({ category, searchQuery = "", viewMode = "grid" }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])

  // Mock products data - in real app this would come from API/database
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Abstract 01",
        description: "Abstract art description here.",
        price: 1500,
        image: "/abstract-colorful-art.png",
        category: "Originals", // Updated to match renamed category
        sku: "ABS-001",
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
        sku: "ABS-002",
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
        category: "Originals", // Updated to match renamed category
        sku: "ABS-003",
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
        sku: "ABS-004",
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

    let filteredProducts = mockProducts.filter((product) => product.status === "Active")

    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.category === category ||
          (category === "Originals" && product.category === "Artwork") ||
          (category === "Artwork" && product.category === "Originals"),
      )
    }

    if (searchQuery) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setProducts(filteredProducts)
  }, [category, searchQuery])

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/live-site/product/${product.id}`}
            className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow bg-card"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                  <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
                </div>
                {product.featured && <BiStar className="text-yellow-500 w-5 h-5" />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/live-site/product/${product.id}`}
          className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-square">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.featured && <BiStar className="absolute top-3 right-3 text-yellow-500 w-6 h-6" />}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
            <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
