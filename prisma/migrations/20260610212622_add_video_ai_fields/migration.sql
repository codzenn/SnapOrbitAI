-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "videoAspectRatioUrl" TEXT,
ADD COLUMN     "videoCaptions" JSONB,
ADD COLUMN     "videoCompressedUrl" TEXT,
ADD COLUMN     "videoHasAudio" BOOLEAN,
ADD COLUMN     "videoMood" TEXT,
ADD COLUMN     "videoScenes" JSONB,
ADD COLUMN     "videoSummary" TEXT,
ADD COLUMN     "videoTopics" JSONB,
ADD COLUMN     "videoTranscript" TEXT;
