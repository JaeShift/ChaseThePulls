export type ProductCategory =
  | "BOOSTER_PACK"
  | "BOOSTER_BOX"
  | "BOOSTER_BUNDLE"
  | "STARTER_STRUCTURE_DECK"
  | "COLLECTION_BOX"
  | "ACCESSORIES"
  | "ETB"
  | "BLISTER"
  | "UPC"
  | "SPC"
  | "TIN"
  | "BOXED_SET";

/** Every DB category (for URL / API validation). */
export const PRODUCT_CATEGORY_LIST: readonly ProductCategory[] = [
  "BOOSTER_PACK",
  "BOOSTER_BOX",
  "BOOSTER_BUNDLE",
  "STARTER_STRUCTURE_DECK",
  "COLLECTION_BOX",
  "ACCESSORIES",
  "ETB",
  "BLISTER",
  "UPC",
  "SPC",
  "TIN",
  "BOXED_SET",
];

export function isProductCategory(s: string): s is ProductCategory {
  return (PRODUCT_CATEGORY_LIST as readonly string[]).includes(s);
}

export type ProductGame =
  | "ONE_PIECE"
  | "MAGIC_THE_GATHERING"
  | "POKEMON"
  | "YUGIOH";

export type ProductSubcategory =
  | "TRADING_CARD_GAME"
  | "PLUSH"
  | "FUNKO"
  | "MISCELLANEOUS";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Role = "USER" | "ADMIN";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /** Long-form copy (specs, care, what’s in the box, etc.) */
  details?: string | null;
  price: number;
  comparePrice?: number | null;
  images: string[];
  game: ProductGame;
  subcategory: ProductSubcategory;
  category: ProductCategory;
  stock: number;
  featured: boolean;
  set?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  userId?: string | null;
  email: string;
  stripeSessionId?: string | null;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  shippingAddress?: Record<string, string> | null;
  trackingNumber?: string | null;
  items: OrderItem[];
  user?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  BOOSTER_PACK: "Booster Pack",
  BOOSTER_BOX: "Booster Box",
  BOOSTER_BUNDLE: "Booster Bundle",
  STARTER_STRUCTURE_DECK: "Starter / Structure Deck",
  COLLECTION_BOX: "Collection Box",
  ACCESSORIES: "Accessories",
  ETB: "Collector Box",
  BLISTER: "Blister Pack",
  UPC: "Premium Collection",
  SPC: "Special Collection",
  TIN: "Tin",
  BOXED_SET: "Boxed Set",
};

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  BOOSTER_PACK: "#FFD700",
  BOOSTER_BOX: "#22C55E",
  BOOSTER_BUNDLE: "#10B981",
  STARTER_STRUCTURE_DECK: "#A855F7",
  COLLECTION_BOX: "#8B5CF6",
  ACCESSORIES: "#94A3B8",
  ETB: "#8B5CF6",
  BLISTER: "#00D4FF",
  UPC: "#FF3B3B",
  SPC: "#EC4899",
  TIN: "#F59E0B",
  BOXED_SET: "#0EA5E9",
};

export const CATEGORY_BG: Record<ProductCategory, string> = {
  BOOSTER_PACK: "rgba(255, 215, 0, 0.15)",
  BOOSTER_BOX: "rgba(34, 197, 94, 0.15)",
  BOOSTER_BUNDLE: "rgba(16, 185, 129, 0.15)",
  STARTER_STRUCTURE_DECK: "rgba(168, 85, 247, 0.15)",
  COLLECTION_BOX: "rgba(139, 92, 246, 0.15)",
  ACCESSORIES: "rgba(148, 163, 184, 0.15)",
  ETB: "rgba(139, 92, 246, 0.15)",
  BLISTER: "rgba(0, 212, 255, 0.15)",
  UPC: "rgba(255, 59, 59, 0.15)",
  SPC: "rgba(236, 72, 153, 0.15)",
  TIN: "rgba(245, 158, 11, 0.15)",
  BOXED_SET: "rgba(14, 165, 233, 0.15)",
};

export const GAME_LABELS: Record<ProductGame, string> = {
  ONE_PIECE: "One Piece",
  MAGIC_THE_GATHERING: "Magic: The Gathering",
  POKEMON: "Pokémon",
  YUGIOH: "Yu-Gi-Oh!",
};

export const GAME_COLORS: Record<ProductGame, string> = {
  ONE_PIECE: "#E11D48",
  MAGIC_THE_GATHERING: "#1E3A5F",
  POKEMON: "#FFCB05",
  YUGIOH: "#7C3AED",
};

export const GAME_BG: Record<ProductGame, string> = {
  ONE_PIECE: "rgba(225, 29, 72, 0.15)",
  MAGIC_THE_GATHERING: "rgba(30, 58, 95, 0.2)",
  POKEMON: "rgba(255, 203, 5, 0.15)",
  YUGIOH: "rgba(124, 58, 237, 0.15)",
};

