import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZGenerateAllInputSchema } from "./generateAll.schema";
import { ZExpandOutlineInputSchema } from "./expandOutline.schema";
import { ZRegenerateInputSchema } from "./regenerate.schema";

type PostFactoryRouterHandlerCache = {
  generateAll?: typeof import("./generateAll.handler").generateAllHandler;
  expandOutline?: typeof import("./expandOutline.handler").expandOutlineHandler;
  regenerate?: typeof import("./regenerate.handler").regenerateHandler;
};

const UNSTABLE_HANDLER_CACHE: PostFactoryRouterHandlerCache = {};

export const postFactoryRouter = router({
  generateAll: authedProcedure
    .input(ZGenerateAllInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.generateAll) {
        UNSTABLE_HANDLER_CACHE.generateAll = await import(
          "./generateAll.handler"
        ).then((mod) => mod.generateAllHandler);
      }

      if (!UNSTABLE_HANDLER_CACHE.generateAll) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.generateAll({
        ctx,
        input,
      });
    }),

  expandOutline: authedProcedure
    .input(ZExpandOutlineInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.expandOutline) {
        UNSTABLE_HANDLER_CACHE.expandOutline = await import(
          "./expandOutline.handler"
        ).then((mod) => mod.expandOutlineHandler);
      }

      if (!UNSTABLE_HANDLER_CACHE.expandOutline) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.expandOutline({
        ctx,
        input,
      });
    }),

  regenerate: authedProcedure
    .input(ZRegenerateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!UNSTABLE_HANDLER_CACHE.regenerate) {
        UNSTABLE_HANDLER_CACHE.regenerate = await import(
          "./regenerate.handler"
        ).then((mod) => mod.regenerateHandler);
      }

      if (!UNSTABLE_HANDLER_CACHE.regenerate) {
        throw new Error("Failed to load handler");
      }

      return UNSTABLE_HANDLER_CACHE.regenerate({
        ctx,
        input,
      });
    }),
});
