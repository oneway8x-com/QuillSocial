/**
 * Image upload utility functions
 * Shared utilities for handling image conversions and cloud storage uploads
 */

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  id?: number;
  error?: string;
}

/**
 * Convert an image URL to base64 data URL
 * @param url - Image URL to convert
 * @returns Promise with base64 data URL
 */
export async function convertImageToBase64(url: string): Promise<string | ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}

/**
 * Upload base64 image to Google Cloud Storage
 * @param base64Image - Base64 encoded image data
 * @param originalFileName - Original filename for the image
 * @returns Upload result with public URL and file ID
 */
export async function uploadImageToCloudStorage(
  base64Image: string,
  originalFileName: string
): Promise<UploadResult> {
  try {
    const response = await fetch("/api/integrations/googlecloudstorage/uploadBase64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image,
        originalFileName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        publicUrl: data.publicUrl,
        id: data.id,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || "Upload failed",
      };
    }
  } catch (error) {
    console.error("Error uploading to cloud storage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate if a string is a valid image URL
 * @param url - URL to validate
 * @returns True if valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const pathname = urlObj.pathname.toLowerCase();

    return validExtensions.some((ext) => pathname.endsWith(ext)) || pathname.includes("/image");
  } catch {
    return false;
  }
}

/**
 * Get file extension from base64 data URL
 * @param base64 - Base64 data URL
 * @returns File extension (e.g., "jpg", "png")
 */
export function getFileExtensionFromBase64(base64: string): string {
  const match = base64.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : "jpg";
}

/**
 * Compress image if it exceeds a certain size
 * @param base64Image - Base64 encoded image
 * @param maxSizeInBytes - Maximum size in bytes (default 10MB)
 * @returns Compressed base64 image or original if already small enough
 */
export async function compressImageIfNeeded(
  base64Image: string,
  maxSizeInBytes: number = 10 * 1024 * 1024
): Promise<string> {
  // Calculate approximate size of base64 string
  const sizeInBytes = (base64Image.length * 3) / 4;

  if (sizeInBytes <= maxSizeInBytes) {
    return base64Image;
  }

  // TODO: Implement actual compression using canvas
  // For now, just return the original
  console.warn("Image exceeds size limit but compression not implemented");
  return base64Image;
}
