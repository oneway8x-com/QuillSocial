import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  const { pillars_count, slots_count } = req.body || {};

  const placeholders_created = (Number(slots_count) || 0) * 4; // 4 upcoming weeks

  await captureServer(userId, "onb_plan_applied", {
    pillars_count: Number(pillars_count) || 0,
    slots_count: Number(slots_count) || 0,
    placeholders_created,
  });

  res.status(200).json({ ok: true, placeholders_created });
}
