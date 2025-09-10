"use client"

import type React from "react"
import { BiTrash } from "react-icons/bi"
import { useToast } from "@/hooks/use-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

const mockCategories = [
  {
    id: 1,
    name: "Originals",
    description: "Original paintings and canvas works",
    productCount: 12,
    status: "Active",
    showInNavigation: true,
    featuredOnHome: true,
    order: 1,
  },
  {
    id: 2,
    name: "Accessories",
    description: "Art-related accessories and items",
    productCount: 8,
    status: "Active",
    showInNavigation: true,
    featuredOnHome: false,
    order: 2,
  },
]

const mockTags = ["Abstract", "Modern", "Contemporary", "Colorful", "Minimalist"]

export function CategoriesTable() {
  const [categories, setCategories] = useState(mockCategories)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [showAddCategoryDrawer, setShowAddCategoryDrawer] = useState(false)
  const [showAddTagDrawer, setShowAddTagDrawer] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [newTagName, setNewTagName] = useState("")

  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [featuredOnHome, setFeaturedOnHome] = useState(false)
  const [showInNavigation, setShowInNavigation] = useState(true)

  const { toast } = useToast()

  const handleAddCategory = () => {
    if (!categoryName.trim()) return

    const newCategory = {
      id: Math.max(...categories.map((c) => c.id)) + 1,
      name: categoryName,
      description: categoryDescription,
      productCount: 0,
      status: "Active",
      showInNavigation: showInNavigation,
      featuredOnHome: featuredOnHome,
      order: categories.length + 1,
    }

    if (editingCategory) {
      // Update existing category
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id
            ? { ...cat, name: categoryName, description: categoryDescription, featuredOnHome, showInNavigation }
            : cat,
        ),
      )
    } else {
      // Add new category
      setCategories([...categories, newCategory])
    }

    // Reset form and close drawer
    setCategoryName("")
    setCategoryDescription("")
    setFeaturedOnHome(false)
    setShowInNavigation(true)
    setShowAddCategoryDrawer(false)
    setEditingCategory(null)
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description)
    setFeaturedOnHome(category.featuredOnHome)
    setShowInNavigation(category.showInNavigation)
    setShowAddCategoryDrawer(true)
  }

  const handleDeleteCategory = () => {
    if (!editingCategory) return

    setCategories(categories.filter((cat) => cat.id !== editingCategory.id))

    toast({
      variant: "success",
      title: "Category deleted",
      description: `${editingCategory.name} has been successfully deleted.`,
    })

    // Reset form and close drawer
    setCategoryName("")
    setCategoryDescription("")
    setFeaturedOnHome(false)
    setShowInNavigation(true)
    setShowAddCategoryDrawer(false)
    setEditingCategory(null)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newCategories = [...categories]
    const draggedCategory = newCategories[draggedItem]
    newCategories.splice(draggedItem, 1)
    newCategories.splice(dropIndex, 0, draggedCategory)

    // Update order values
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
    }))

    setCategories(updatedCategories)
    setDraggedItem(null)
  }

  const toggleNavigation = (id: number) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, showInNavigation: !cat.showInNavigation } : cat)))
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <Button onClick={() => setShowAddCategoryDrawer(true)}>Add Category</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Navigation</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow
                    key={category.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="cursor-move hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center justify-center text-muted-foreground">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="4" cy="4" r="1" />
                          <circle cx="4" cy="8" r="1" />
                          <circle cx="4" cy="12" r="1" />
                          <circle cx="12" cy="4" r="1" />
                          <circle cx="12" cy="8" r="1" />
                          <circle cx="12" cy="12" r="1" />
                        </svg>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {category.name}
                          {category.featuredOnHome && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{category.productCount}</TableCell>
                    <TableCell>
                      <Switch
                        checked={category.showInNavigation}
                        onCheckedChange={() => toggleNavigation(category.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tags</CardTitle>
            <Button onClick={() => setShowAddTagDrawer(true)}>Add Tag</Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockTags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddCategoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
          <div className="bg-background w-full max-w-md h-full shadow-lg overflow-y-auto dark:bg-gray-800">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <div className="flex items-center gap-2">
                  {editingCategory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteCategory}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <BiTrash className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddCategoryDrawer(false)
                      setEditingCategory(null)
                      setCategoryName("")
                      setCategoryDescription("")
                      setFeaturedOnHome(false)
                      setShowInNavigation(true)
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-200">Name</label>
                <Input
                  placeholder="Enter category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-200">Description</label>
                <Input
                  placeholder="Enter category description"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="feature-home" checked={featuredOnHome} onCheckedChange={setFeaturedOnHome} />
                <div className="space-y-1">
                  <label htmlFor="feature-home" className="text-sm font-medium cursor-pointer dark:text-gray-200">
                    Feature on Home Page
                  </label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Featured categories will display their top products on the home page
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="show-navigation" checked={showInNavigation} onCheckedChange={setShowInNavigation} />
                <div className="space-y-1">
                  <label htmlFor="show-navigation" className="text-sm font-medium cursor-pointer dark:text-gray-200">
                    Show in Navigation
                  </label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Display this category in the top navigation of the live site
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t mt-auto dark:border-gray-700">
              <Button className="w-full" onClick={handleAddCategory} disabled={!categoryName.trim()}>
                {editingCategory ? "Save Changes" : "Add Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddTagDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
          <div className="bg-background w-full max-w-md h-full shadow-lg overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add Tag</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddTagDrawer(false)}>
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag Name</label>
                <Input
                  placeholder="Enter tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t mt-auto">
              <Button className="w-full">Add Tag</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
