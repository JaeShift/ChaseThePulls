import { ProductForm } from "@/components/admin/ProductForm"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-1">Add New Product</h1>
        <p className="text-foreground/50">Create a new product listing</p>
      </div>
      <ProductForm mode="create" />
    </div>
  )
}
