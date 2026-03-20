import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  comparePrice: z.coerce.number().positive().optional().nullable(),
  category: z.enum(["BOOSTER_PACK", "ETB", "BLISTER", "BOOSTER_BUNDLE", "UPC", "SPC"]),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  featured: z.boolean().default(false),
  set: z.string().optional().nullable(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
});

export const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive().max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;


