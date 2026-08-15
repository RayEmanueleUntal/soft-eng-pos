"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Product } from "@/app/dashboard/products/products"

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Thread Type</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Retail Price</TableHead>
          <TableHead>Wholesale Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p, i) => (
          <TableRow key={i}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.category}</TableCell>
            <TableCell>{p.threadType}</TableCell>
            <TableCell>{p.material}</TableCell>
            <TableCell>{p.size}</TableCell>
            <TableCell>${p.retailPrice.toFixed(2)}</TableCell>
            <TableCell>${p.wholesalePrice.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableCaption>SKU list with retail and wholesale pricing</TableCaption>
    </Table>
  )
}
