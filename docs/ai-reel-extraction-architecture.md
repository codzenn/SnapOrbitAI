# AI Reel Extraction Architecture

## Overview
The AI Reel Extraction functionality is a robust, production-ready pipeline designed to extract 15-second vertical highlight reels from user-uploaded videos using Cloudinary's `e_preview:duration_15` AI processing.

The system handles file validation, DDOS protection (rate limiting), quota management, and exponential backoff retry mechanisms to ensure high availability.

## Architecture Components

### 1. `app/api/video-upload/route.ts` (Main Controller)
The API route acts as the orchestrator. It executes the following steps in sequence:
1. **IP-Based Rate Limiting**: Uses a sliding window mechanism to block abuse (10 requests per minute per IP).
2. **Authorization & Quota**: Integrates with Clerk to identify the user. Checks Prisma and user metadata to verify if the user has enough quota left for the month based on their specific plan (`free`, `pro`, `pro_plus`). Guest users are allowed 3 uploads.
3. **Payload Parsing**: Extracts the multipart form data.
4. **Validation**: Calls `validateVideo` to ensure the file meets constraints (max 50MB, specific video MIME types).
5. **Processing**: Calls `uploadToCloudinaryWithRetry` to pipe the buffer to Cloudinary.
6. **Data Persistence**: Saves the uploaded video metadata to the PostgreSQL database via Prisma and updates the user's monthly quota.

### 2. `lib/video-pipeline.ts` (Core Pipeline)
This module handles the heavy lifting of processing and validation:
- **`validateVideo(file: File)`**: Enforces strict MIME type checks (`video/mp4`, `video/webm`, `video/quicktime`) and size limits (`50MB`). Throws structured `VideoProcessingError` if validation fails.
- **`uploadToCloudinaryWithRetry(buffer: Buffer)`**: A resilient upload wrapper around `cloudinary.uploader.upload_stream`. It automatically retries failed uploads using an exponential backoff strategy (up to 3 retries, waiting 2s, 4s, 8s).

### 3. `lib/rate-limit.ts` (DDOS Protection)
An in-memory sliding window rate limiter that tracks IP addresses. It automatically cleans up expired records every 5 minutes to prevent memory leaks. While an external store like Redis is recommended for distributed systems, this provides excellent baseline protection.

### 4. `lib/logger.ts` (Observability)
A custom structured JSON logger that outputs `info`, `warn`, and `error` events. Every request is tagged with a unique `reqId` to enable easy distributed tracing and debugging in production environments (like Datadog or AWS CloudWatch).

## API Endpoints

### `POST /api/video-upload`
Uploads a video and returns the extracted reel's Cloudinary public ID.

**Request (multipart/form-data):**
- `file`: The video file (Blob/File).
- `title` (optional): Name of the video.
- `description` (optional): Description of the video.

**Response (200 OK):**
```json
{
  "id": "cm...123",
  "title": "My Video",
  "publicId": "video-uploads/abc123xyz",
  "originalSize": "15000000",
  "compressedSize": "5000000",
  "duration": 120
}
```

**Error Responses:**
- `429 Too Many Requests`: Rate limit exceeded.
- `403 Forbidden`: Quota exceeded or guest limit reached.
- `413 Payload Too Large`: File exceeds 50MB.
- `415 Unsupported Media Type`: Invalid video format.
- `502 Bad Gateway`: Cloudinary service unavailable after retries.

## Testing & Quality Assurance
The pipeline is fully covered by unit tests using Vitest (`__tests__/api/video-pipeline.test.ts`). 
- Tests mock the Cloudinary SDK and verify validation logic.
- Tests ensure the exponential backoff retry mechanism correctly fires on network failures and eventually throws a custom error if all attempts fail.
- Coverage metrics ensure >90% reliability on core extraction paths.