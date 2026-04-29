import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateVideo, VideoProcessingError, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, uploadToCloudinaryWithRetry } from '../../lib/video-pipeline';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn().mockReturnValue({}),
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

// Mock logger to avoid console spam during tests
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Video Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateVideo', () => {
    it('should throw an error if no file is provided', async () => {
      await expect(validateVideo(null as unknown as File)).rejects.toThrow(VideoProcessingError);
      await expect(validateVideo(null as unknown as File)).rejects.toThrow('No file provided');
    });

    it('should throw an error for unsupported mime types', async () => {
      const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
      await expect(validateVideo(file)).rejects.toThrow(VideoProcessingError);
      await expect(validateVideo(file)).rejects.toThrow('Unsupported format: text/plain');
    });

    it('should throw an error if file exceeds max size', async () => {
      // Mocking a file object with large size
      const file = { type: 'video/mp4', size: MAX_FILE_SIZE + 1 } as File;
      await expect(validateVideo(file)).rejects.toThrow(VideoProcessingError);
      await expect(validateVideo(file)).rejects.toThrow('File size exceeds 50MB limit');
    });

    it('should pass validation for valid video files', async () => {
      const file = { type: 'video/mp4', size: 1024 } as File;
      const result = await validateVideo(file);
      expect(result).toBe(true);
    });

    it('should pass validation for webm and mov files', async () => {
      expect(await validateVideo({ type: 'video/webm', size: 1024 } as File)).toBe(true);
      expect(await validateVideo({ type: 'video/quicktime', size: 1024 } as File)).toBe(true);
    });
  });

  describe('uploadToCloudinaryWithRetry', () => {
    it('should upload successfully on the first attempt', async () => {
      const mockResult = { public_id: 'test_id', bytes: 123 };
      
      const mockEnd = vi.fn();
      (cloudinary.uploader.upload_stream as any).mockImplementation((options: any, callback: any) => {
        // Run immediately instead of setTimeout to avoid fake timer issues with promises
        callback(null, mockResult);
        return { end: mockEnd };
      });

      const buffer = Buffer.from('dummy data');
      const result = await uploadToCloudinaryWithRetry(buffer);

      expect(result).toEqual(mockResult);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledWith(buffer);
    });

    it('should retry on failure and succeed', async () => {
      const mockResult = { public_id: 'test_id', bytes: 123 };
      const mockEnd = vi.fn();
      
      let callCount = 0;
      (cloudinary.uploader.upload_stream as any).mockImplementation((options: any, callback: any) => {
        callCount++;
        if (callCount === 1) {
          callback(new Error('Network error'), null);
        } else {
          callback(null, mockResult);
        }
        return { end: mockEnd };
      });

      const buffer = Buffer.from('dummy data');
      const promise = uploadToCloudinaryWithRetry(buffer);
      
      // Fast forward the backoff timeout
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual(mockResult);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(2);
    });

    it('should throw VideoProcessingError after max retries', async () => {
      const mockEnd = vi.fn();
      
      (cloudinary.uploader.upload_stream as any).mockImplementation((options: any, callback: any) => {
        callback(new Error('Persistent network error'), null);
        return { end: mockEnd };
      });

      const buffer = Buffer.from('dummy data');
      const promise = uploadToCloudinaryWithRetry(buffer);
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow(VideoProcessingError);
      await expect(promise).rejects.toThrow('Failed to upload video to Cloudinary after multiple attempts. Service might be down.');
      
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(3);
    });
  });
});