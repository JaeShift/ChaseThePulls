export type ProductCategory =
  | "BOOSTER_PACK"
  | "ETB"
  | "BLISTER"
  | "BOOSTER_BUNDLE"
  | "UPC"
  | "SPC";

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
  price: number;
  comparePrice?: number | null;
  images: string[];
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
  ETB: "Elite Trainer Box",
  BLISTER: "Blister Pack",
  BOOSTER_BUNDLE: "Booster Bundle",
  UPC: "Ultra Premium Collection",
  SPC: "Special Collection",
};

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  BOOSTER_PACK: "#FFD700",
  ETB: "#8B5CF6",
  BLISTER: "#00D4FF",
  BOOSTER_BUNDLE: "#10B981",
  UPC: "#FF3B3B",
  SPC: "#EC4899",
};

export const CATEGORY_BG: Record<ProductCategory, string> = {
  BOOSTER_PACK: "rgba(255, 215, 0, 0.15)",
  ETB: "rgba(139, 92, 246, 0.15)",
  BLISTER: "rgba(0, 212, 255, 0.15)",
  BOOSTER_BUNDLE: "rgba(16, 185, 129, 0.15)",
  UPC: "rgba(255, 59, 59, 0.15)",
  SPC: "rgba(236, 72, 153, 0.15)",
};


