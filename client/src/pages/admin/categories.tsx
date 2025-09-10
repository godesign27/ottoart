import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GripVertical } from "lucide-react";
import { CategoryDrawer } from "@/components/admin/category-drawer";
import { TagDrawer } from "@/components/admin/tag-drawer";
import type { Category, Tag } from "@shared/schema";

export default function AdminCategories() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [tagDrawerOpen, setTagDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: tags, isLoading: tagsLoading } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryDrawerOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDrawerOpen(true);
  };

  const handleAddTag = () => {
    setEditingTag(null);
    setTagDrawerOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagDrawerOpen(true);
  };

  const handleCloseCategoryDrawer = () => {
    setCategoryDrawerOpen(false);
    setEditingCategory(null);
  };

  const handleCloseTagDrawer = () => {
    setTagDrawerOpen(false);
    setEditingTag(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Categories & Tags</h2>
                <p className="text-muted-foreground">Organize your products with categories and tags</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categories */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">Categories</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={handleAddCategory}
                    data-testid="add-category-button"
                  >
                    Add Category
                  </Button>
                </CardHeader>
                <div className="divide-y divide-border">
                  {categoriesLoading ? (
                    <div className="p-4">
                      <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-4 w-4 bg-muted rounded"></div>
                              <div className="h-4 bg-muted rounded w-32"></div>
                            </div>
                            <div className="h-6 bg-muted rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    categories?.map((category) => (
                      <div 
                        key={category.id} 
                        className="p-4 flex items-center justify-between hover:bg-accent cursor-move"
                        data-testid={`category-${category.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{category.name}</span>
                              {category.isFeatured && (
                                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">12 products</span>
                          <Switch 
                            checked={category.isActive} 
                            data-testid={`category-toggle-${category.id}`}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary/80"
                            onClick={() => handleEditCategory(category)}
                            data-testid={`edit-category-${category.id}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Tags */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">Tags</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={handleAddTag}
                    data-testid="add-tag-button"
                  >
                    Add Tag
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {tagsLoading ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-6 bg-muted rounded w-20 inline-block mr-2"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags?.map((tag) => (
                        <Badge 
                          key={tag.id}
                          variant="secondary" 
                          className="inline-flex items-center px-3 py-1 text-sm cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleEditTag(tag)}
                          data-testid={`tag-${tag.slug}`}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Category Drawer */}
      <CategoryDrawer
        isOpen={categoryDrawerOpen}
        onClose={handleCloseCategoryDrawer}
        editCategory={editingCategory}
      />

      {/* Tag Drawer */}
      <TagDrawer
        isOpen={tagDrawerOpen}
        onClose={handleCloseTagDrawer}
        editTag={editingTag}
      />
    </div>
  );
}
