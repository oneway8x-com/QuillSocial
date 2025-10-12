-- CreateEnum
CREATE TYPE "XEngagementStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "XConnectSetting" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY['connect', 'letsconnect', 'followback', 'buildinpublic', 'devcommunity', 'indiehackers', 'techtwitter', '100DaysOfCode']::TEXT[],
    "language" TEXT,
    "minLikes" INTEGER,
    "minReplies" INTEGER,
    "excludeKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeFollowed" BOOLEAN NOT NULL DEFAULT true,
    "dailyMaxComments" INTEGER NOT NULL DEFAULT 20,
    "rateSpacingMs" INTEGER NOT NULL DEFAULT 3000,
    "topics" TEXT[] DEFAULT ARRAY['Frontend', 'Backend', 'GenAI', 'Full-stack', 'DevOps', 'DSA', 'LeetCode', 'AI/ML', 'Web3', 'Data Science', 'Freelancing', 'Python', 'Startup']::TEXT[],
    "monthlyReadCap" INTEGER NOT NULL DEFAULT 100,
    "monthlyPostCap" INTEGER NOT NULL DEFAULT 500,
    "maxReadsPerScan" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XConnectSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XDiscoveredPost" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "xPostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT,
    "authorIsFollowed" BOOLEAN NOT NULL DEFAULT false,
    "text" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lang" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XDiscoveredPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XEngagementJob" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "xPostId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "plannedComment" TEXT NOT NULL,
    "status" "XEngagementStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "XEngagementJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XUsageCounter" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "readsUsed" INTEGER NOT NULL DEFAULT 0,
    "postsUsed" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XConnectSetting_userId_idx" ON "XConnectSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "XConnectSetting_userId_key" ON "XConnectSetting"("userId");

-- CreateIndex
CREATE INDEX "XDiscoveredPost_userId_authorIsFollowed_idx" ON "XDiscoveredPost"("userId", "authorIsFollowed");

-- CreateIndex
CREATE INDEX "XDiscoveredPost_discoveredAt_idx" ON "XDiscoveredPost"("discoveredAt");

-- CreateIndex
CREATE UNIQUE INDEX "XDiscoveredPost_userId_xPostId_key" ON "XDiscoveredPost"("userId", "xPostId");

-- CreateIndex
CREATE INDEX "XEngagementJob_userId_status_idx" ON "XEngagementJob"("userId", "status");

-- CreateIndex
CREATE INDEX "XEngagementJob_scheduledAt_idx" ON "XEngagementJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "XUsageCounter_userId_idx" ON "XUsageCounter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "XUsageCounter_userId_key" ON "XUsageCounter"("userId");

-- AddForeignKey
ALTER TABLE "XConnectSetting" ADD CONSTRAINT "XConnectSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
