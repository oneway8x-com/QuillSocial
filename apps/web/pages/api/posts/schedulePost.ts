import { getUserStats } from "@server/lib/posts/functCheck";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { defaultResponder } from "@quillsocial/lib/server";
import { PostStatus } from "@quillsocial/lib/constants/enums";
import prisma from "@quillsocial/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await getServerSession({ req, res });
    if (!session?.user?.id) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const { id, scheduleDay } = req.body;
    const findBilling = await prisma.billing.findFirst({
      where: {
        userId: session?.user?.id,
      },
      select: {
        type: true,
      },
    });
    const type = findBilling ? findBilling.type : "FREE_TIER";
    const findStatusUser = await getUserStats(session?.user?.id);
    // const checkCondition = getConditionToUpgrade(findStatusUser, type!);

    // const isMonthValid = isWithinMonthLimit(scheduleDay, checkCondition.month);
    // if (!isMonthValid) {
    //     res.status(401).json({ message: "Must update subscription plan to use" });
    //     return;
    // }

    const schedule = await prisma.post.update({
      where: {
        id: id,
      },
      data: {
        schedulePostDate: new Date(scheduleDay),
        status: PostStatus.SCHEDULED,
      },
    });
    return schedule;
  }
}

export default defaultResponder(handler);
