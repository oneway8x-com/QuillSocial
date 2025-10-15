import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";
import prisma from "@quillsocial/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { pillars_count, slots_count, pillars, purpose, tone, audienceStage } = req.body || {};

  try {
    // Save onboarding plan to user metadata
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          onboardingPlan: {
            purpose: purpose || "",
            tone: tone || "friendly",
            audienceStage: audienceStage || "starting",
            pillarsCount: Number(pillars_count) || 0,
            slotsCount: Number(slots_count) || 0,
            pillars: pillars || [],
            appliedAt: new Date().toISOString(),
          },
        },
      },
    });

    const placeholders_created = (Number(slots_count) || 0) * 4; // 4 upcoming weeks

    await captureServer(userId, "onb_plan_applied", {
      pillars_count: Number(pillars_count) || 0,
      slots_count: Number(slots_count) || 0,
      placeholders_created,
    });

    res.status(200).json({ ok: true, placeholders_created });
  } catch (error) {
    console.error("Error applying onboarding plan:", error);
    res.status(500).json({ error: "Failed to apply plan" });
  }
}
