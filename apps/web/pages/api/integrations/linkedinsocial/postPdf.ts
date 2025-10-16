import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import postPdfHandler from "@quillsocial/app-store/linkedinsocial/api/postPdf";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Populate session before delegating to the app-store handler
  req.session = await getServerSession({ req, res });
  return postPdfHandler(req, res);
}
