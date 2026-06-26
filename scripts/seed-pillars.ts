#!/usr/bin/env ts-node
/**
 * Seed script to generate default pillars for a user
 * Usage: npx ts-node scripts/seed-pillars.ts [userId]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PILLARS = [
  { name: "Build in Public", color: "bg-indigo-600", order: 0 },
  { name: "Founder Lessons", color: "bg-cyan-500", order: 1 },
  { name: "Client Wins", color: "bg-green-600", order: 2 },
  { name: "Playbooks", color: "bg-orange-500", order: 3 },
];

async function main() {
  const userIdArg = process.argv[2];
  let userId: number;

  if (userIdArg) {
    userId = parseInt(userIdArg, 10);
    if (isNaN(userId)) {
      console.error("❌ Invalid user ID provided");
      process.exit(1);
    }
  } else {
    // Get the first user if no userId provided
    const user = await prisma.user.findFirst({
      orderBy: { id: "asc" },
    });

    if (!user) {
      console.error("❌ No users found in database. Please create a user first.");
      process.exit(1);
    }

    userId = user.id;
    console.log(`📍 No userId provided, using first user: ${user.email} (ID: ${userId})`);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found`);
    process.exit(1);
  }

  console.log(`\n👤 Generating pillars for: ${user.email} (ID: ${userId})\n`);

  // Create pillars
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
  };

  for (const pillarData of DEFAULT_PILLARS) {
    try {
      const existing = await prisma.pillar.findUnique({
        where: {
          userId_name: {
            userId: userId,
            name: pillarData.name,
          },
        },
      });

      if (existing) {
        if (existing.deletedAt) {
          console.log(`🔄 Restoring soft-deleted pillar: ${pillarData.name}`);
          await prisma.pillar.update({
            where: { id: existing.id },
            data: {
              deletedAt: null,
              color: pillarData.color,
              order: pillarData.order,
            },
          });
          results.created++;
        } else {
          console.log(`⏭️  Pillar already exists: ${pillarData.name}`);
          results.skipped++;
        }
      } else {
        const pillar = await prisma.pillar.create({
          data: {
            userId: userId,
            ...pillarData,
          },
        });
        console.log(`✅ Created pillar: ${pillar.name}`);
        results.created++;
      }
    } catch (error) {
      console.error(`❌ Error creating pillar "${pillarData.name}":`, error);
      results.errors++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Created/Restored: ${results.created}`);
  console.log(`⏭️  Skipped (already exists): ${results.skipped}`);
  console.log(`❌ Errors: ${results.errors}`);
  console.log("=".repeat(50));

  // Show final state
  const allPillars = await prisma.pillar.findMany({
    where: {
      userId: userId,
      deletedAt: null,
    },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { ideas: true },
      },
    },
  });

  console.log("\n📋 Current Pillars:");
  allPillars.forEach((pillar) => {
    console.log(`   • ${pillar.name} (${pillar.color}) - ${pillar._count.ideas} ideas`);
  });

  console.log("\n✨ Done!\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
