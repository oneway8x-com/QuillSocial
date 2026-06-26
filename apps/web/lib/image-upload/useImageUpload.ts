import { useState } from "react";
import { showToast } from "@quillsocial/ui";
import { convertImageToBase64, uploadImageToCloudStorage } from "./imageUtils";

export enum ImageSourceType {
  Upload = "upload",
  Unsplash = "unsplash",
  Embed = "embed",
}

interface UseImageUploadReturn {
  imageSrc: string;
  cloudFileId: number | undefined;
  isLoading: boolean;
  setImageSrc: (src: string) => void;
  setCloudFileId: (id: number | undefined) => void;
  handleImageUpload: (imageDataUrl: string, fileName?: string) => Promise<void>;
  handleUnsplashImage: (imageUrl: string) => Promise<void>;
  handleEmbedImage: (imageUrl: string) => Promise<void>;
  clearImage: () => void;
}

/**
 * Reusable hook for handling image uploads from various sources
 * Supports: direct upload, Unsplash, and embedded URLs
 * Automatically uploads to Google Cloud Storage for Instagram compatibility
 */
export function useImageUpload(): UseImageUploadReturn {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [cloudFileId, setCloudFileId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle direct image upload (file from computer)
   */
  const handleImageUpload = async (imageDataUrl: string, fileName = "uploaded-image.jpg") => {
    setIsLoading(true);
    try {
      const result = await uploadImageToCloudStorage(imageDataUrl, fileName);

      if (result.success && result.publicUrl) {
        setImageSrc(result.publicUrl);
        setCloudFileId(result.id);
      } else {
        // Fallback to base64 if upload fails
        setImageSrc(imageDataUrl);
        setCloudFileId(undefined);
        showToast("Image uploaded locally (Instagram posting may fail)", "warning");
      }
    } catch (error) {
      // Fallback to base64 if upload fails
      setImageSrc(imageDataUrl);
      setCloudFileId(undefined);
      showToast("Image uploaded locally (Instagram posting may fail)", "warning");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Unsplash image selection
   */
  const handleUnsplashImage = async (imageUrl: string) => {
    setIsLoading(true);
    try {
      const base64 = await convertImageToBase64(imageUrl);

      const result = await uploadImageToCloudStorage(base64 as string, "unsplash-image.jpg");

      if (result.success && result.publicUrl) {
        setImageSrc(result.publicUrl);
        setCloudFileId(result.id);
      } else {
        setImageSrc(base64 as string);
        setCloudFileId(undefined);
        showToast("Image uploaded locally (Instagram posting may fail)", "warning");
      }
    } catch (error) {
      setImageSrc("");
      setCloudFileId(undefined);
      showToast("Failed to load image from Unsplash", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle embedded image URL
   */
  const handleEmbedImage = async (imageUrl: string) => {
    setIsLoading(true);
    try {
      const base64 = await convertImageToBase64(imageUrl);

      if (base64) {
        const image = new window.Image();

        image.onload = async () => {
          const result = await uploadImageToCloudStorage(base64 as string, "embedded-image.jpg");

          if (result.success && result.publicUrl) {
            setImageSrc(result.publicUrl);
            setCloudFileId(result.id);
          } else {
            setImageSrc(base64 as string);
            setCloudFileId(undefined);
            showToast("Image uploaded locally (Instagram posting may fail)", "warning");
          }
          setIsLoading(false);
        };

        image.onerror = () => {
          setImageSrc("");
          setCloudFileId(undefined);
          showToast("Invalid image URL", "error");
          setIsLoading(false);
        };

        image.src = base64 as string;
      } else {
        showToast("Failed to convert image", "error");
        setIsLoading(false);
      }
    } catch (error) {
      setImageSrc("");
      setCloudFileId(undefined);
      showToast("Failed to load image from URL", "error");
      setIsLoading(false);
    }
  };

  /**
   * Clear all image data
   */
  const clearImage = () => {
    setImageSrc("");
    setCloudFileId(undefined);
  };

  return {
    imageSrc,
    cloudFileId,
    isLoading,
    setImageSrc,
    setCloudFileId,
    handleImageUpload,
    handleUnsplashImage,
    handleEmbedImage,
    clearImage,
  };
}
