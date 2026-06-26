import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";
import prisma from "@quillsocial/prisma";
import { PostStatus } from "@quillsocial/prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    planId,
    pillars_count,
    slots_count,
    pillars,
    purpose,
    tone,
    audienceStage,
    week1Schedule,
    engagementTargets,
    metrics,
    byok,
  } = req.body || {};

  try {
    // Save onboarding plan to user metadata
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          onboardingPlan: {
            planId: planId || `plan_${Date.now()}`,
            purpose: purpose || "",
            tone: tone || "friendly",
            audienceStage: audienceStage || "starting",
            pillarsCount: Number(pillars_count) || 0,
            slotsCount: Number(slots_count) || 0,
            pillars: pillars || [],
            week1Schedule: week1Schedule || [],
            engagementTargets: engagementTargets || {
              meaningfulRepliesPerDay: 5,
              personas: ["Peers", "Prospects", "Leaders"],
            },
            metrics: metrics || {
              weeklyPostTarget: 5,
              dailyReplyTarget: 5,
            },
            byok: byok || {
              xConnected: false,
              engagementLists: [],
            },
            appliedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Create draft posts for week 1 schedule
    const drafts_created: number[] = [];
    if (week1Schedule && Array.isArray(week1Schedule)) {
      for (const slot of week1Schedule) {
        try {
          // Map channel to appId
          const channelAppMap: Record<string, string> = {
            linkedin: "linkedinsocial",
            x: "xsocial",
            instagram: "instagramsocial",
            youtube: "youtubesocial",
            blog: "blogsocial",
          };

          const appId = channelAppMap[slot.channel] || "linkedinsocial";

          // Find user's credential for this platform
          const credential = await prisma.credential.findFirst({
            where: {
              userId,
              appId,
            },
            orderBy: {
              id: "desc",
            },
          });

          // Create the draft content from the slot
          const draftContent = [
            slot.draft.hook,
            "",
            ...slot.draft.outline,
            "",
            slot.draft.cta,
            "",
            ...(slot.draft.hashtags || []),
          ].join("\n");

          // Create draft post
          const post = await prisma.post.create({
            data: {
              userId,
              credentialId: credential?.id || null,
              appId,
              idea: slot.draft.title,
              content: draftContent,
              status: PostStatus.NEW,
              schedulePostDate: new Date(slot.date),
              tone: tone?.toUpperCase() || "FRIENDLY",
              title: slot.draft.title,
            },
          });

          drafts_created.push(post.id);

          // Capture draft created event
          await captureServer(userId, "draft_created", {
            channel: slot.channel,
            postId: post.id,
          });
        } catch (draftError) {
          console.error("Error creating draft for slot:", slot, draftError);
          // Continue with other drafts
        }
      }
    }

    const drafts_count = drafts_created.length;

    await captureServer(userId, "onb_plan_applied", {
      pillars_count: Number(pillars_count) || 0,
      slots_count: Number(slots_count) || 0,
      drafts_created: drafts_count,
    });

    await captureServer(userId, "onboarding_step_advanced", {
      to: "first_post",
    });

    res.status(200).json({
      ok: true,
      drafts_created: drafts_count,
      draftIds: drafts_created,
    });
  } catch (error) {
    console.error("Error applying onboarding plan:", error);
    res.status(500).json({ error: "Failed to apply plan" });
  }
}
