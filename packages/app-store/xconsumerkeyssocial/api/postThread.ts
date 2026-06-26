import { postThread } from "../lib/twitterManager";
import type { NextApiRequest, NextApiResponse } from "next";

//http://localhost:3000/api/integrations/xconsumerkeyssocial/postThread?id={postId}&credentialId={credentialId}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }

  if (req.method === "POST") {
    const idQuery = req.query.id;
    const credentialIdQuery = req.query.credentialId;

    if (idQuery && +idQuery > 0 && credentialIdQuery && +credentialIdQuery > 0) {
      const id = +idQuery;
      const credentialId = +credentialIdQuery;
      const result = await postThread(id, credentialId);
      if (result.success) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } else {
      res.status(400).json({ success: false, error: "Invalid Id or credentialId value" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
