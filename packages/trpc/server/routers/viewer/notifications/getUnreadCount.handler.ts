import { prisma } from "@quillsocial/prisma";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";

type GetUnreadCountOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const getUnreadCountHandler = async ({ ctx }: GetUnreadCountOptions) => {
  const count = await prisma.notification.count({
    where: {
      userId: ctx.user.id,
      isRead: false,
    },
  });

  return { count };
};
