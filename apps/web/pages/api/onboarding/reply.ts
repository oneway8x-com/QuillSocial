import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  const { platform, cardId } = req.body || {};

  await captureServer(userId, "onb_reply_sent", {
    platform,
    cardId,
  });

  res.status(200).json({ ok: true });
}
