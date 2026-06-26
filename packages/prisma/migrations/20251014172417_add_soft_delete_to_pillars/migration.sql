-- AlterTable
ALTER TABLE "Pillar" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Pillar_userId_deletedAt_idx" ON "Pillar"("userId", "deletedAt");
