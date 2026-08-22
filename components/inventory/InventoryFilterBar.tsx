"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { mockInventory } from "@/lib/inventory/mock-inventory"

interface InventoryFilterBarProps {
  size: string | null
  setSize: (size: string | null) => void
  threadType: string | null
  setThreadType: (threadType: string | null) => void
  material: string | null
  setMaterial: (material: string | null) => void
  category: string | null
  setCategory: (category: string | null) => void
}

const sizes = [...new Set(mockInventory.map((item) => item.size))]
const threadTypes = [...new Set(mockInventory.map((item) => item.threadType))]
const materials = [...new Set(mockInventory.map((item) => item.material))]
const categories = [...new Set(mockInventory.map((item) => item.category))]

export function InventoryFilterBar({
  size,
  setSize,
  threadType,
  setThreadType,
  material,
  setMaterial,
  category,
  setCategory,
}: InventoryFilterBarProps) {
  const handleClearFilters = () => {
    setSize(null)
    setThreadType(null)
    setMaterial(null)
    setCategory(null)
  }

  const areFiltersActive = size || threadType || material || category

  return (
    <div className="flex items-center space-x-4">
      <Select
        value={size || ""}
        onValueChange={(value) => setSize(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by size..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All Sizes</SelectItem>
            {sizes.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={threadType || ""}
        onValueChange={(value) =>
          setThreadType(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by thread type..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All Thread Types</SelectItem>
            {threadTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={material || ""}
        onValueChange={(value) =>
          setMaterial(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by material..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All Materials</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={category || ""}
        onValueChange={(value) =>
          setCategory(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        onClick={handleClearFilters}
        disabled={!areFiltersActive}
      >
        Clear Filters
      </Button>
    </div>
  )
}
