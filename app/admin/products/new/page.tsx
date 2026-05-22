import { ProductForm } from "@/components/admin/ProductForm"
import { NewProductMobileHeader } from "@/components/admin/NewProductMobileHeader"

export default function NewProductPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop heading — hidden on mobile (mobile uses sticky header below) */}
      <div className="hidden sm:block">
        <h1 className="font-display font-bold text-4xl text-foreground mb-1">Add New Product</h1>
        <p className="text-foreground/50">Create a new product listing</p>
      </div>

      {/* Mobile sticky quick-action header */}
      <NewProductMobileHeader />

      <ProductForm mode="create" />
    </div>
  )
}
