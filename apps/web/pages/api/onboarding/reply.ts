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

  const { platform, cardId, replyContent } = req.body || {};

  try {
    // Get current user metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const currentMetadata = (user?.metadata as any) || {};
    const onboardingReplies = currentMetadata.onboardingReplies || [];

    // Add new reply to metadata
    const updatedReplies = [
      ...onboardingReplies,
      {
        platform,
        cardId,
        content: replyContent || "Reply from onboarding",
        sentAt: new Date().toISOString(),
      },
    ];

    // Update user metadata with reply history
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...currentMetadata,
          onboardingReplies: updatedReplies,
        },
      },
    });

    await captureServer(userId, "onb_reply_sent", {
      platform,
      cardId,
      totalReplies: updatedReplies.length,
    });

    res.status(200).json({ ok: true, totalReplies: updatedReplies.length });
  } catch (error) {
    console.error("Error recording onboarding reply:", error);
    res.status(500).json({ error: "Failed to record reply" });
  }
}
