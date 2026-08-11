"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function CategoryManager() {
  const [categories, setCategories] = useState(["Bolts", "Nuts", "Screws", "Washers"])
  const [newCategory, setNewCategory] = useState("")

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Categories</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Product Categories</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddCategory} className="flex gap-2 my-2">
          <Input
            placeholder="New Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat, idx) => (
            <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm">
              {cat}
            </Badge>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}