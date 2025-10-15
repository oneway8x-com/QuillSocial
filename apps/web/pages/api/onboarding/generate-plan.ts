import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  const { preset, tone, audienceStage, pillars_count, slots_count } = req.body || {};

  await captureServer(userId, "onb_generate_plan_clicked", {
    preset: preset || null,
    tone,
    audienceStage,
  });

  // Mirror: plan generated
  await captureServer(userId, "onb_plan_generated", {
    pillars_count: Number(pillars_count) || 0,
    slots_count: Number(slots_count) || 0,
  });

  res.status(200).json({ ok: true });
}
