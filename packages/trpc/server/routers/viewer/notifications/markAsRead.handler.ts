import { prisma } from "@quillsocial/prisma";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import { TRPCError } from "@trpc/server";
import type { TMarkAsReadInputSchema } from "./markAsRead.schema";

type MarkAsReadOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TMarkAsReadInputSchema;
};

export const markAsReadHandler = async ({ ctx, input }: MarkAsReadOptions) => {
  const { notificationIds, all } = input;

  if (!all && (!notificationIds || notificationIds.length === 0)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Either provide notificationIds or set all to true",
    });
  }

  const where = all
    ? { userId: ctx.user.id, isRead: false }
    : { userId: ctx.user.id, id: { in: notificationIds } };

  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
    },
  });

  return {
    success: true,
    count: result.count,
  };
};
