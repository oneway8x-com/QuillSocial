import type { GenerateCarouselInput } from "./generateCarousel.schema";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import type { PrismaClient } from "@quillsocial/prisma/client";
import { DEFAULT_BRAND, renderImagesFromJson, renderPdfFromJson } from "@quillsocial/docs-render";
import { readFileSync, unlinkSync } from "fs";
import { uploadGCP } from "@quillsocial/app-store/googlecloudstorage/lib/uploadGCP";
import logger from "@quillsocial/lib/logger";

interface GenerateCarouselHandlerOptions {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: GenerateCarouselInput;
}

export async function generateCarouselHandler({
  ctx,
  input,
}: GenerateCarouselHandlerOptions) {
  const { slides, format, brandName } = input;

  // Convert slides to CarouselInput format - ensure all slides have at least a heading
  const carouselSlides = slides.map((slide, index) => ({
    heading: slide.heading || `Slide ${index + 1}`,
    subheading: slide.subheading,
    bullets: slide.bullets,
  }));

  const carouselInput = {
    slides: carouselSlides,
    brand: brandName
      ? {
          ...DEFAULT_BRAND,
          logoText: brandName,
        }
      : undefined,
  };

  try {
    if (format === "pdf") {
      // Generate PDF
      const pdfPath = await renderPdfFromJson(carouselInput);

      logger.info(`[Carousel] PDF generated at: ${pdfPath}`);

      // Upload to GCS
      const gcpResult = await uploadGCP(`carousel-${Date.now()}.pdf`, pdfPath);

      // Clean up the temp file
      try {
        unlinkSync(pdfPath);
      } catch (err) {
        logger.warn("Failed to clean up temp PDF:", err);
      }

      if (!gcpResult.success) {
        throw new Error("Failed to upload PDF to Google Cloud Storage");
      }

      // Create CloudFile record
      const cloudFile = await ctx.prisma.cloudFile.create({
        data: {
          cloudFileId: gcpResult.uuid,
          fileExt: gcpResult.ext,
          fileName: gcpResult.originFileName,
          fileSize: null, // We don't have file size info from GCP upload
        },
      });

      logger.info(`[Carousel] PDF uploaded to GCS: ${gcpResult.fileName}`);

      return {
        format: "pdf" as const,
        cloudFile: {
          id: cloudFile.id,
          cloudFileId: cloudFile.cloudFileId,
          fileExt: cloudFile.fileExt,
          fileName: cloudFile.fileName,
        },
        publicUrl: `/api/integrations/googlecloudstorage/get?file=${cloudFile.cloudFileId}.${cloudFile.fileExt}`,
      };
    } else {
      // Generate images
      const imagePaths = await renderImagesFromJson(carouselInput);

      logger.info(`[Carousel] Generated ${imagePaths.length} images`);

      // Upload all images to GCS and create CloudFile records
      const uploadedImages = await Promise.all(
        imagePaths.map(async (path, index) => {
          const gcpResult = await uploadGCP(`carousel-slide-${index + 1}-${Date.now()}.png`, path);

          // Clean up the temp file
          try {
            unlinkSync(path);
          } catch (err) {
            logger.warn("Failed to clean up temp image:", err);
          }

          if (!gcpResult.success) {
            throw new Error(`Failed to upload image ${index + 1} to Google Cloud Storage`);
          }

          // Create CloudFile record
          const cloudFile = await ctx.prisma.cloudFile.create({
            data: {
              cloudFileId: gcpResult.uuid,
              fileExt: gcpResult.ext,
              fileName: gcpResult.originFileName,
              fileSize: null,
            },
          });

          return {
            id: cloudFile.id,
            cloudFileId: cloudFile.cloudFileId,
            fileExt: cloudFile.fileExt,
            fileName: cloudFile.fileName,
            publicUrl: `/api/integrations/googlecloudstorage/get?file=${cloudFile.cloudFileId}.${cloudFile.fileExt}`,
          };
        })
      );

      logger.info(`[Carousel] All images uploaded to GCS`);

      return {
        format: "images" as const,
        images: uploadedImages,
      };
    }
  } catch (error) {
    console.error("Failed to generate carousel:", error);
    throw new Error(
      `Failed to generate carousel: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
