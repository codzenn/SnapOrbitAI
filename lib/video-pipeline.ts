import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

// Initialize Cloudinary SDK
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Global configurations
export const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_RETRIES = 3;

interface CloudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  eager?: any[];
  [key: string]: unknown;
}

export class VideoProcessingError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "VideoProcessingError";
  }
}

/**
 * Validates the file to ensure it meets MIME type and size constraints.
 * @param file 
 */
export async function validateVideo(file: File) {
  if (!file) throw new VideoProcessingError("No file provided", 400);
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new VideoProcessingError(
      `Unsupported format: ${file.type}. Supported formats: MP4, WebM, MOV`, 
      415
    );
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new VideoProcessingError(
      `File size exceeds 50MB limit: ${(file.size / 1024 / 1024).toFixed(2)}MB`, 
      413
    );
  }
  return true;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Uploads a video buffer to Cloudinary with exponential backoff retries.
 * @param buffer Video buffer
 * @param attempt Current attempt count
 * @param reqId Optional request ID for log tracing
 */
export async function uploadToCloudinaryWithRetry(
  buffer: Buffer, 
  attempt = 1,
  reqId?: string,
  isReel = false
): Promise<CloudinaryUploadResult> {
  try {
    logger.info(`Starting Cloudinary upload`, { attempt, reqId, isReel });
    
    const transformations = [{ quality: "auto", fetch_format: "mp4" }];
    // For faster reel generation, we use 720p (720x1280) instead of 1080p, and limit framerate/quality.
    const eager = isReel ? [
      { width: 720, height: 1280, crop: "fill", gravity: "auto", effect: "preview:duration_15", quality: "auto:eco", fetch_format: "mp4" }
    ] : undefined;

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "video-uploads",
          transformation: transformations,
          eager: eager,
          eager_async: isReel, // MUST be true for e_preview AI transformations, otherwise Cloudinary ignores it synchronously
          timeout: 120000 // 120s timeout for large files processing synchronously
        },
        (error, res) => {
          if (error) {
            reject(error);
          } else {
            resolve(res as CloudinaryUploadResult);
          }
        }
      ).end(buffer);
    });
    
    logger.info(`Cloudinary upload successful`, { reqId, public_id: result.public_id });
    return result;
    
  } catch (error: any) {
    logger.error(`Cloudinary upload attempt ${attempt} failed`, error, { reqId });
    
    if (attempt < MAX_RETRIES) {
      const backoff = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      logger.info(`Retrying upload in ${backoff}ms...`, { reqId });
      await sleep(backoff);
      return uploadToCloudinaryWithRetry(buffer, attempt + 1, reqId, isReel);
    }
    
    throw new VideoProcessingError("Failed to upload video to Cloudinary after multiple attempts. Service might be down.", 502);
  }
}