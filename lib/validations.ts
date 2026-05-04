import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().nonnegative().optional()
);

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().positive().optional()
);

const productCategorySchema = z.enum([
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
  "CARD_BINDER",
  "TOP_LOADER",
  "CARD_SLEEVES",
  "PLAYMAT",
  "DECK_BOX",
]);

const productGameSchema = z.enum(["ONE_PIECE", "MAGIC_THE_GATHERING", "POKEMON", "YUGIOH"]);
const productSubcategorySchema = z.enum(["TRADING_CARD_GAME", "PLUSH", "FUNKO", "CLOTHING", "ACCESSORIES"]);

const referenceImageVariantSchema = z.object({
  name: z.string().min(1),
  images: z.array(z.string().url()).default([]),
});

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
  details: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  comparePrice: z.coerce.number().positive().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  referenceImages: z.array(z.string().url()).default([]),
  category: productCategorySchema,
  game: productGameSchema,
  subcategory: productSubcategorySchema,
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  featured: z.boolean().default(false),
  set: z.string().optional().nullable(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
});

export const draftProductSchema = z.object({
  name: z.string().optional().nullable(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  price: optionalPositiveNumber.nullable(),
  comparePrice: optionalPositiveNumber.nullable(),
  sourceUrl: z.string().url().optional().nullable().or(z.literal("")),
  referenceImages: z.array(z.string().url()).default([]),
  referenceImageVariants: z.array(referenceImageVariantSchema).default([]),
  category: productCategorySchema.default("ACCESSORIES"),
  game: productGameSchema.default("POKEMON"),
  subcategory: productSubcategorySchema.default("TRADING_CARD_GAME"),
  stock: optionalNumber.nullable(),
  featured: z.boolean().default(false),
  set: z.string().optional().nullable(),
  images: z.array(z.string().url()).default([]),
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
export type DraftProductInput = z.infer<typeof draftProductSchema>;
export type ReferenceImageVariantInput = z.infer<typeof referenceImageVariantSchema>;


