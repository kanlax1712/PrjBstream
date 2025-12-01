/**
 * Storage utility that works with both local filesystem (dev) and Vercel Blob (production)
 */

import { promises as fs } from "fs";
import path from "path";

// Check if we're in production (Vercel)
const isProduction = process.env.NODE_ENV === "production";
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload a file to storage (local filesystem or Vercel Blob)
 */
export async function uploadFile(
  file: File,
  prefix: string
): Promise<string> {
  // Use Vercel Blob in production if token is available
  if (isProduction && useVercelBlob) {
    return uploadToVercelBlob(file, prefix);
  }

  // Use local filesystem for development
  return uploadToLocal(file, prefix);
}

/**
 * Upload to local filesystem (development)
 */
async function uploadToLocal(file: File, prefix: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".mp4";
  const normalized = file.name
    .replace(ext, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const filename = `${prefix}-${Date.now()}-${normalized}${ext}`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

/**
 * Upload to Vercel Blob Storage (production)
 */
async function uploadToVercelBlob(
  file: File,
  prefix: string
): Promise<string> {
  try {
    // Dynamic import to avoid errors if @vercel/blob is not installed
    const { put } = await import("@vercel/blob");

    const ext = path.extname(file.name) || ".mp4";
    const normalized = file.name
      .replace(ext, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const filename = `${prefix}-${Date.now()}-${normalized}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Vercel Blob automatically reads BLOB_READ_WRITE_TOKEN from environment variables
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    return blob.url;
  } catch (error) {
    console.error("Vercel Blob upload failed:", error);
    throw new Error("Failed to upload file to storage");
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  // If it's a Vercel Blob URL, delete from blob storage
  if (fileUrl.startsWith("https://") && fileUrl.includes("blob.vercel-storage.com")) {
    try {
      const { del } = await import("@vercel/blob");
      await del(fileUrl);
    } catch (error) {
      console.error("Failed to delete from Vercel Blob:", error);
    }
    return;
  }

  // If it's a local file path, delete from filesystem
  if (fileUrl.startsWith("/uploads/")) {
    try {
      const filepath = path.join(process.cwd(), "public", fileUrl);
      await fs.unlink(filepath);
    } catch (error) {
      console.error("Failed to delete local file:", error);
    }
  }
}

