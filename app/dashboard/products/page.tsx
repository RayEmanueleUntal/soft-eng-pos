import { products } from "./data"
import { ProductTable } from "@/components/products/ProductTable"
import { AddProductModal } from "@/components/products/AddProductModal"
import { CategoryManager } from "@/components/products/CategoryManager"

export default function ProductsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <CategoryManager />
          <AddProductModal />
        </div>
      </div>

      <ProductTable products={products} />
    </div>
  )
}