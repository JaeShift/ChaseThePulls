import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Non-null when Cloudinary env is incomplete (common after typos or missing restart). */
export function getCloudinaryEnvError(): string | null {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!name) return "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local";
  if (!key) return "Missing CLOUDINARY_API_KEY in .env.local";
  if (!secret) return "Missing CLOUDINARY_API_SECRET in .env.local";
  return null;
}

export async function uploadImage(
  file: string,
  folder = "chase-the-pulls/products"
): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
  });
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
