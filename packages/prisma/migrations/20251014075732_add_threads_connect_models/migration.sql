-- CreateEnum
CREATE TYPE "ThreadsEngagementStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThreadsDiscoveredStatus" AS ENUM ('ACTIVE', 'QUEUED', 'ENGAGED', 'SKIPPED');

-- CreateTable
CREATE TABLE "ThreadsConnectSetting" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY['connect', 'letsconnect', 'followback', 'buildinpublic', 'devcommunity', 'indiehackers', 'techthreads', '100DaysOfCode']::TEXT[],
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

    CONSTRAINT "ThreadsConnectSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadsDiscoveredPost" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "threadsPostId" TEXT NOT NULL,
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
    "status" "ThreadsDiscoveredStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ThreadsDiscoveredPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadsEngagementJob" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "threadsPostId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "plannedComment" TEXT NOT NULL,
    "status" "ThreadsEngagementStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "ThreadsEngagementJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadsUsageCounter" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "readsUsed" INTEGER NOT NULL DEFAULT 0,
    "postsUsed" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadsUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreadsConnectSetting_userId_idx" ON "ThreadsConnectSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadsConnectSetting_userId_key" ON "ThreadsConnectSetting"("userId");

-- CreateIndex
CREATE INDEX "ThreadsDiscoveredPost_userId_authorIsFollowed_idx" ON "ThreadsDiscoveredPost"("userId", "authorIsFollowed");

-- CreateIndex
CREATE INDEX "ThreadsDiscoveredPost_discoveredAt_idx" ON "ThreadsDiscoveredPost"("discoveredAt");

-- CreateIndex
CREATE INDEX "ThreadsDiscoveredPost_userId_status_idx" ON "ThreadsDiscoveredPost"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadsDiscoveredPost_userId_threadsPostId_key" ON "ThreadsDiscoveredPost"("userId", "threadsPostId");

-- CreateIndex
CREATE INDEX "ThreadsEngagementJob_userId_status_idx" ON "ThreadsEngagementJob"("userId", "status");

-- CreateIndex
CREATE INDEX "ThreadsEngagementJob_scheduledAt_idx" ON "ThreadsEngagementJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "ThreadsUsageCounter_userId_idx" ON "ThreadsUsageCounter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadsUsageCounter_userId_key" ON "ThreadsUsageCounter"("userId");

-- AddForeignKey
ALTER TABLE "ThreadsConnectSetting" ADD CONSTRAINT "ThreadsConnectSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
