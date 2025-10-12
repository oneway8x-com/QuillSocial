-- CreateEnum
CREATE TYPE "XDiscoveredStatus" AS ENUM ('ACTIVE', 'ENGAGED', 'SKIPPED');

-- AlterTable
ALTER TABLE "XDiscoveredPost" ADD COLUMN     "status" "XDiscoveredStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "XDiscoveredPost_userId_status_idx" ON "XDiscoveredPost"("userId", "status");
