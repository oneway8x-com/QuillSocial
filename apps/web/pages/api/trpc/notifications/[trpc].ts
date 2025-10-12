import { createNextApiHandler } from "@quillsocial/trpc/server/createNextApiHandler";
import { notificationsRouter } from "@quillsocial/trpc/server/routers/viewer/notifications/_router";

export default createNextApiHandler(notificationsRouter);
