import { LinkedinManager } from "../lib";
import type { NextApiRequest, NextApiResponse } from "next";

// POST /api/integrations/linkedinsocial/postPdf?id={postId}&title={title}&credentialId={credentialId}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  if (req.method === "POST") {
    const idQuery = req.query.id;
    const title = typeof req.query.title === 'string' ? req.query.title : undefined;
    const credentialIdQuery = req.query.credentialId;

    if (idQuery && +idQuery > 0 && credentialIdQuery && +credentialIdQuery > 0) {
      const id = +idQuery;
      const credentialId = +credentialIdQuery;
      const result = await LinkedinManager.postPdf(id, credentialId, title);
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, error: "Error occurred when posting PDF to LinkedIn." });
      }
    } else {
      res.status(400).json({ success: false, error: "Invalid Id or credentialId value" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
