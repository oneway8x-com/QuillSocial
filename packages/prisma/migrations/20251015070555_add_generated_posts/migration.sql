-- CreateTable
CREATE TABLE "GeneratedPost" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "ideaId" TEXT,
    "outline" TEXT NOT NULL,
    "tone" "OutlineTone" NOT NULL DEFAULT 'FRIENDLY',
    "outputs" JSONB NOT NULL,
    "cta" TEXT,
    "utm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedPost_userId_idx" ON "GeneratedPost"("userId");

-- CreateIndex
CREATE INDEX "GeneratedPost_ideaId_idx" ON "GeneratedPost"("ideaId");

-- CreateIndex
CREATE INDEX "GeneratedPost_userId_createdAt_idx" ON "GeneratedPost"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GeneratedPost" ADD CONSTRAINT "GeneratedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPost" ADD CONSTRAINT "GeneratedPost_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
