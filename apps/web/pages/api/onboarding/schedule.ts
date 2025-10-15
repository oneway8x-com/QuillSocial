import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;
  const { channel, whenISO } = req.body || {};

  await captureServer(userId, "onb_post_scheduled", {
    channel,
    whenISO,
  });

  // return a fake draft id for now
  res.status(200).json({ ok: true, draftId: `draft_${Date.now()}` });
}
