import { createNextApiHandler } from "@quillsocial/trpc/server/createNextApiHandler";
import { postFactoryRouter } from "@quillsocial/trpc/server/routers/viewer/postFactory/_router";

export default createNextApiHandler(postFactoryRouter);
