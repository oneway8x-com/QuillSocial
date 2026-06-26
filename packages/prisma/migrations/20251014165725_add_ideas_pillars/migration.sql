-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('RAW', 'OUTLINED');

-- CreateEnum
CREATE TYPE "OutlineTone" AS ENUM ('FRIENDLY', 'AUTHORITATIVE', 'CONTRARIAN');

-- CreateTable
CREATE TABLE "Pillar" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-indigo-600',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "pillarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'RAW',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outline" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tone" "OutlineTone" NOT NULL DEFAULT 'FRIENDLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pillar_userId_idx" ON "Pillar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pillar_userId_name_key" ON "Pillar"("userId", "name");

-- CreateIndex
CREATE INDEX "Idea_userId_idx" ON "Idea"("userId");

-- CreateIndex
CREATE INDEX "Idea_pillarId_idx" ON "Idea"("pillarId");

-- CreateIndex
CREATE INDEX "Idea_userId_status_idx" ON "Idea"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Outline_ideaId_key" ON "Outline"("ideaId");

-- CreateIndex
CREATE INDEX "Outline_ideaId_idx" ON "Outline"("ideaId");

-- AddForeignKey
ALTER TABLE "Pillar" ADD CONSTRAINT "Pillar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outline" ADD CONSTRAINT "Outline_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
