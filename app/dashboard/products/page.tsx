import { products } from "./data"
import { ProductTable } from "@/components/products/productstable"

export default function ProductsPage() {
  return (
    <div className="p-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Products</h1>
      </div>
      <ProductTable products={products} />
    </div>
  )
}
