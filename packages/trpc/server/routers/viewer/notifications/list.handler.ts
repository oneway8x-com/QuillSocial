import { prisma } from "@quillsocial/prisma";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import type { TListNotificationsInputSchema } from "./list.schema";

type ListNotificationsOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TListNotificationsInputSchema;
};

export const listNotificationsHandler = async ({ ctx, input }: ListNotificationsOptions) => {
  const { limit, offset, unreadOnly } = input;

  const where = {
    userId: ctx.user.id,
    ...(unreadOnly && { isRead: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: offset + limit < total,
  };
};
