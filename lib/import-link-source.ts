/** Admin link import UI + scrape API branches on this field. Safe for client + server (no server-only deps). */

export type ImportLinkSource = "amazon" | "ultrapro"

export const IMPORT_LINK_SOURCE_OPTIONS: readonly { value: ImportLinkSource; label: string }[] = [
  { value: "amazon", label: "Amazon" },
  { value: "ultrapro", label: "Ultra PRO / Ultra Gaming" },
]

export function parseImportLinkSource(value: unknown): ImportLinkSource {
  return value === "ultrapro" ? "ultrapro" : "amazon"
}

export function isUltraProUrl(candidate: string): boolean {
  try {
    const hostname = new URL(candidate).hostname.toLowerCase().replace(/^www\./, "")
    return hostname === "shop.ultragaming.com" || hostname.endsWith(".ultragaming.com") || hostname.includes("ultrapro.")
  } catch {
    return false
  }
}
