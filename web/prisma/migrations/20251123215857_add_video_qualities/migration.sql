-- CreateTable
CREATE TABLE "VideoQuality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "bitrate" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoQuality_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoQuality_videoId_idx" ON "VideoQuality"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoQuality_videoId_quality_key" ON "VideoQuality"("videoId", "quality");
