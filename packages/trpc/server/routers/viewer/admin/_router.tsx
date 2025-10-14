import authedProcedure, {
  authedAdminProcedure,
} from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZListUsersInputSchema } from "./listUsers.schema";

type AdminRouterHandlerCache = {
  listUsers?: typeof import("./listUsers.handler").listUsersHandler;
};

const UNSTABLE_HANDLER_CACHE: AdminRouterHandlerCache = {};

export const viewerAdminRouter = router({
  listUsers: authedAdminProcedure
    .input(ZListUsersInputSchema)
    .query(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.listUsers) {
        UNSTABLE_HANDLER_CACHE.listUsers = await import(
          "./listUsers.handler"
        ).then((mod) => mod.listUsersHandler);
      }

      // Unreachable code but required for type safety
      if (!UNSTABLE_HANDLER_CACHE.listUsers) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.listUsers({
        ctx,
        input,
      });
    }),
});
