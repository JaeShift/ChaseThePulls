"use client"

import { Link2 } from "lucide-react"

export function NewProductMobileHeader() {
  const focusImport = () => {
    const textarea = document.getElementById("import-url-textarea")
    if (!textarea) return
    textarea.scrollIntoView({ behavior: "smooth", block: "center" })
    setTimeout(() => textarea.focus(), 300)

    // Also open the import section if it's collapsed by triggering the toggle button
    const importSection = document.querySelector("[data-section-toggle='import']")
    if (importSection instanceof HTMLElement) importSection.click()
  }

  return (
    <div className="sm:hidden flex items-center justify-between gap-3 py-1">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground leading-tight">Add Product</h1>
        <p className="text-xs text-foreground/50 mt-0.5">New listing</p>
      </div>
      <button
        type="button"
        onClick={focusImport}
        className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent/90 transition-colors active:scale-95"
      >
        <Link2 className="h-4 w-4" />
        Paste &amp; Import
      </button>
    </div>
  )
}
