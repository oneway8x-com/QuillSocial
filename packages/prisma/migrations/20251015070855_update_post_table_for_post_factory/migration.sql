/*
  Warnings:

  - You are about to drop the `GeneratedPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneratedPost" DROP CONSTRAINT "GeneratedPost_ideaId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedPost" DROP CONSTRAINT "GeneratedPost_userId_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "cta" TEXT,
ADD COLUMN     "ideaId" TEXT,
ADD COLUMN     "multiPlatformOutputs" JSONB,
ADD COLUMN     "tone" "OutlineTone",
ADD COLUMN     "utm" TEXT;

-- DropTable
DROP TABLE "GeneratedPost";

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_ideaId_idx" ON "Post"("ideaId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
