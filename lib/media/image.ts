import imageCompression from "browser-image-compression";
import { MAX_IMAGE_DIMENSION, MAX_IMAGE_MB } from "@/lib/constants";
import { MediaPipelineError, type OptimizedMedia } from "@/lib/types";

/**
 * Client-side image pipeline: resize to ≤ 2560px, transcode to WebP, target
 * ≤ 2 MB. Runs in a web worker. The output size is re-verified — the bucket
 * would accept up to 25 MB, but the product rule is 2 MB per image.
 */
export async function optimizeImage(file: File): Promise<OptimizedMedia> {
  if (!file.type.startsWith("image/")) {
    throw new MediaPipelineError("NOT AN IMAGE FILE");
  }

  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: MAX_IMAGE_MB,
      maxWidthOrHeight: MAX_IMAGE_DIMENSION,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.85,
    });
  } catch {
    throw new MediaPipelineError("IMAGE COMPRESSION FAILED — UNSUPPORTED OR CORRUPT FILE");
  }

  if (compressed.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new MediaPipelineError("IMAGE EXCEEDS 2 MB AFTER COMPRESSION");
  }

  return {
    blob: compressed,
    ext: "webp",
    contentType: "image/webp",
    mediaType: "image",
  };
}
