import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import postThreadHandler from "@quillsocial/app-store/xconsumerkeyssocial/api/postThread";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  req.session = await getServerSession({ req, res });
  return postThreadHandler(req, res);
}
