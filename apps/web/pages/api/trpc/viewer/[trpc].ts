import { createNextApiHandler } from "@quillsocial/trpc/server/createNextApiHandler";
import { viewerRouter } from "@quillsocial/trpc/server/routers/viewer/_router";

export default createNextApiHandler(viewerRouter);
