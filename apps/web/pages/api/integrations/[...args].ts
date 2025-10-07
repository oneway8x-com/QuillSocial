import getInstalledAppPath from "@quillsocial/app-store/_utils/getInstalledAppPath";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { TrackEventJuneSo, EVENTS } from "@quillsocial/features/june.so/juneso";
import { deriveAppDictKeyFromType } from "@quillsocial/lib/deriveAppDictKeyFromType";
import { HttpError } from "@quillsocial/lib/http-error";
import prisma from "@quillsocial/prisma";
import type {
  AppDeclarativeHandler,
  AppHandler,
} from "@quillsocial/types/AppHandler";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";

const defaultIntegrationAddHandler = async ({
  slug,
  supportsMultipleInstalls,
  appType,
  user,
  createCredential,
}: {
  slug: string;
  supportsMultipleInstalls: boolean;
  appType: string;
  user?: Session["user"];
  createCredential: AppDeclarativeHandler["createCredential"];
}) => {
  if (!user?.id) {
    throw new HttpError({
      statusCode: 401,
      message: "You must be logged in to do this",
    });
  }
  if (!supportsMultipleInstalls) {
    const alreadyInstalled = await prisma.credential.findFirst({
      where: {
        appId: slug,
        userId: user.id,
      },
    });
    if (alreadyInstalled) {
      throw new Error("App is already installed");
    }
  }
  await createCredential({ user: user, appType, slug });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Check that user is authenticated
  req.session = await getServerSession({ req, res });

  const { args } = req.query;

  if (!Array.isArray(args)) {
    return res.status(404).json({ message: `API route not found` });
  }
  const userId = req.session?.user.id;

  const [appName, apiEndpoint] = args;
  let nameApp =
    appName.split("_")[0].charAt(0).toUpperCase() +
    appName.split("_")[0].slice(1);
  if (nameApp === `Twitterv1`) nameApp = "Twitter";

  try {
    /* Absolute path didn't work */
    const handlerMap = (
      await import("@quillsocial/app-store/apps.server.generated")
    ).apiHandlers;
    const handlerKey = deriveAppDictKeyFromType(appName, handlerMap);
    const handlers = await handlerMap[handlerKey as keyof typeof handlerMap];
    const handler = handlers[
      apiEndpoint as keyof typeof handlers
    ] as AppHandler;
    let redirectUrl = "/apps/installed";
    if (typeof handler === "undefined")
      throw new HttpError({
        statusCode: 404,
        message: `API handler not found`,
      });

    if (typeof handler === "function") {
      await handler(req, res);
    } else {
      await defaultIntegrationAddHandler({
        user: req.session?.user,
        ...handler,
      });
      redirectUrl = handler.redirect?.url || getInstalledAppPath(handler);
      res.json({ url: redirectUrl, newTab: handler.redirect?.newTab });
    }
    return res.status(200);
  } catch (error) {
    // Ensure we always log useful, serialised error information instead of [object Object]
    const formatError = (err: unknown) => {
      if (err instanceof Error) {
        return {
          message: err.message,
          name: err.name,
          stack: err.stack,
        } as const;
      }
      try {
        return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } catch (_e) {
        return { message: typeof err === "string" ? err : String(err) };
      }
    };

    const serialized = formatError(error);
    // Log with serialized details to make Cloud Run logs readable
    console.error("/api/integrations error:", serialized);

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message, details: serialized });
    }
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message, details: serialized });
    }
    return res.status(500).json({ message: `API handler error`, details: serialized });
  }
};

export default handler;
