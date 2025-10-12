import { createNextApiHandler } from "@quillsocial/trpc/server/createNextApiHandler";
import { xConnectRouter } from "@quillsocial/trpc/server/routers/viewer/xConnect";

export default createNextApiHandler(xConnectRouter);
