import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { defaultResponder } from "@quillsocial/lib/server";
import prisma from "@quillsocial/prisma";
import { Prisma } from "@quillsocial/prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const session = await getServerSession({ req, res });
    if (!session?.user?.id) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const { query } = req;
    const { credentialId, pageId } = query;

    // Parse credentialId safely - only include it if valid
    let numCredentialId: number | undefined;
    if (typeof credentialId === "string") {
      const parsed = parseInt(credentialId, 10);
      if (!isNaN(parsed)) {
        numCredentialId = parsed;
      }
    }

    const where: Prisma.PostWhereInput = {
      userId: session?.user?.id,
      status: "NEW",
      ...(numCredentialId !== undefined && { credentialId: numCredentialId }),
      ...(pageId && { pageId: pageId as string }),
    };

    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        createdDate: "desc",
      },
      select: {
        id: true,
        content: true,
        title: true,
        createdDate: true,
        imagesDataURL: true,
        pageId: true,
        credential: {
          select: {
            avatarUrl: true,
            name: true,
            emailOrUserName: true,
          },
        },
      },
    });
    res.status(200).json({ data: posts });
    return;
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default defaultResponder(handler);
