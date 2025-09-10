import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function CategoriesHeader() {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Categories & Tags</h1>
        <p className="text-muted-foreground">Organize your products with categories and tags</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search categories..." className="pl-10 w-64" />
        </div>
      </div>
    </div>
  )
}
