import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZListNotificationsInputSchema } from "./list.schema";
import { ZMarkAsReadInputSchema } from "./markAsRead.schema";

type NotificationsRouterHandlerCache = {
  list?: typeof import("./list.handler").listNotificationsHandler;
  markAsRead?: typeof import("./markAsRead.handler").markAsReadHandler;
  getUnreadCount?: typeof import("./getUnreadCount.handler").getUnreadCountHandler;
};

const UNSTABLE_HANDLER_CACHE: NotificationsRouterHandlerCache = {};

export const notificationsRouter = router({
  list: authedProcedure
    .input(ZListNotificationsInputSchema)
    .query(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.list) {
        UNSTABLE_HANDLER_CACHE.list = await import("./list.handler").then(
          (mod) => mod.listNotificationsHandler
        );
      }

      if (!UNSTABLE_HANDLER_CACHE.list) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.list({ ctx, input });
    }),

  markAsRead: authedProcedure
    .input(ZMarkAsReadInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.markAsRead) {
        UNSTABLE_HANDLER_CACHE.markAsRead = await import("./markAsRead.handler").then(
          (mod) => mod.markAsReadHandler
        );
      }

      if (!UNSTABLE_HANDLER_CACHE.markAsRead) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.markAsRead({ ctx, input });
    }),

  getUnreadCount: authedProcedure.query(async ({ ctx }) => {
    if (!UNSTABLE_HANDLER_CACHE.getUnreadCount) {
      UNSTABLE_HANDLER_CACHE.getUnreadCount = await import("./getUnreadCount.handler").then(
        (mod) => mod.getUnreadCountHandler
      );
    }

    if (!UNSTABLE_HANDLER_CACHE.getUnreadCount) {
      throw new Error("Failed to load handler");
    }

    return UNSTABLE_HANDLER_CACHE.getUnreadCount({ ctx });
  }),
});
