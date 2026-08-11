"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AddProductModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    threadType: "",
    material: "",
    size: "",
    retailPrice: "",
    wholesalePrice: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic to save product will connect here later
    console.log("New Product:", formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add New Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Hardware Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Input
            placeholder="Product Name (e.g., Hex Bolt)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            placeholder="Category (e.g., Bolts)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
          <Input
            placeholder="Thread Type (e.g., Metric, UNC)"
            value={formData.threadType}
            onChange={(e) => setFormData({ ...formData, threadType: e.target.value })}
            required
          />
          <Input
            placeholder="Material (e.g., Stainless Steel 304)"
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            required
          />
          <Input
            placeholder="Size (e.g., M8 x 20mm)"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Retail Price (PHP)"
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              required
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Wholesale Price (PHP)"
              value={formData.wholesalePrice}
              onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}