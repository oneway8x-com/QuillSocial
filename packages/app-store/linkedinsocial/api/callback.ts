import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import { PageInfo } from "../../types";
import { LinkedinManager } from "../lib";
import { getUserProfile } from "../lib/linkedinManager";
import { resetCachedSocialProfile } from "@quillsocial/features/auth/lib/socialProfiles";
import {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  WEBAPP_URL,
} from "@quillsocial/lib/constants";
import logger from "@quillsocial/lib/logger";
import prisma from "@quillsocial/prisma";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

function maskSecret(value?: string | null, head = 6, tail = 4) {
  if (!value || typeof value !== "string") return value;
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

const app_id = LINKEDIN_CLIENT_ID;
const app_secret = LINKEDIN_CLIENT_SECRET;

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface LinkedInUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { code } = req.query;
  const log = logger.getChildLogger({ prefix: ["[linkedinsocial/callback]"] });
  log.info("Webapp URL", { url: WEBAPP_URL });
  const redirectUri = WEBAPP_URL + "/api/integrations/linkedinsocial/callback";

  if (code && typeof code !== "string") {
    res.status(400).json({ message: "`code` must be a string" });
    return;
  }
  if (!req.session?.user?.id) {
    res.status(401).json({ message: "You must be logged in to do this" });
    return;
  }

  if (typeof code === "string") {
    try {
      // Entry log

      log.info("LinkedIn callback invoked", {
        path: req.url,
        method: req.method,
        query: req.query,
        userId: req.session?.user?.id,
        ua: req.headers["user-agent"]?.toString?.().slice?.(0, 200),
      });
      const token = await getAccessToken(
        code,
        app_id!,
        app_secret!,
        redirectUri
      );
      log.info("LinkedIn access token received (masked)", {
        access_token: maskSecret((token as any)?.access_token),
        expires_in: (token as any)?.expires_in,
      });
      const user = await getUserProfile(token.access_token);
      log.info("LinkedIn user profile", {
        sub: user.sub,
        name: user.name,
        email: user.email,
      });
      let pages: PageInfo[] = [
        {
          id: `urn:li:person:${user.sub}`,
          name: user.name,
          isCurrent: true,
          info: user,
        },
      ];
      const companyPages = await LinkedinManager.getLinkedInPages(
        token.access_token
      );
      log.info("LinkedIn company pages fetched", {
        companyPagesCount: companyPages?.length ?? 0,
      });
      if (companyPages) {
        pages.push(...companyPages);
      }
      const existedCredentials = await prisma.credential.findMany({
        where: {
          userId: req.session.user.id,
        },
        select: {
          id: true,
          emailOrUserName: true,
          appId: true,
          isUserCurrentProfile: true,
        },
      });
      const key = token as any; // Cast to match Prisma JsonValue type
      const existed = existedCredentials?.find(
        (x) =>
          x.appId === "linkedin-social" && x.emailOrUserName === user?.email
      );
      log.info("Existed credentials fetched", {
        total: existedCredentials?.length ?? 0,
        foundExisting: !!existed,
        existingId: existed?.id,
      });
      const data = {
        type: "linkedin_social",
        key,
        userId: req.session.user.id,
        appId: "linkedin-social",
        avatarUrl: user?.picture,
        name: user?.name,
        emailOrUserName: user?.email,
        isUserCurrentProfile: true,
        currentPageId: `urn:li:person:${user.sub}`,
      };
      const id = existed?.id ?? 0;

      // Use transaction for database operations
      const upsertedRecord = await prisma.$transaction(async (tx) => {
        await tx.credential.updateMany({
          where: {
            userId: req.session!.user!.id,
          },
          data: {
            isUserCurrentProfile: false,
            currentPageId: null,
          },
        });

        const upsert = await tx.credential.upsert({
          where: {
            id,
          },
          create: data,
          update: data,
        });

        await Promise.all(
          pages.map(async (p) =>
            tx.pageInfo.upsert({
              where: {
                credentialId_id: {
                  credentialId: upsert.id,
                  id: p.id,
                },
              },
              create: {
                ...p,
                credentialId: upsert.id,
                info: p.info,
              },
              update: {
                ...p,
                credentialId: upsert.id,
                info: p.info,
              },
            })
          )
        );

        return upsert;
      });

      log.info("Upserted credential", {
        id: upsertedRecord.id,
        appId: upsertedRecord.appId,
        emailOrUserName: upsertedRecord.emailOrUserName,
      });

      await resetCachedSocialProfile(req.session.user.id);

      res.redirect(
        getInstalledAppPath({ variant: "social", slug: "linkedin-social" })
      );
    } catch (error) {
      const log = logger.getChildLogger({
        prefix: ["[linkedinsocial/callback]"],
      });
      // Log request details and stack for easier troubleshooting
      log.error("LinkedIn OAuth callback error", {
        message: (error as any)?.message ?? String(error),
        stack: (error as any)?.stack,
        query: req.query,
        userId: req.session?.user?.id,
        ua: req.headers["user-agent"]?.toString?.().slice?.(0, 200),
      });
      // Avoid returning sensitive details to the client, but include an id or message
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

async function getAccessToken(
  code: string,
  app_id: string,
  app_secret: string,
  redirectUri: string
): Promise<LinkedInTokenResponse> {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("client_id", app_id);
  params.append("client_secret", app_secret);
  params.append("redirect_uri", redirectUri);

  const response = await safePostAccessToken(
    "https://www.linkedin.com/oauth/v2/accessToken",
    params
  );

  return response;
}

async function safePostAccessToken(
  url: string,
  params: URLSearchParams
): Promise<LinkedInTokenResponse> {
  try {
    const resp = await axios.post<LinkedInTokenResponse>(url, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    // Mask and log minimal info
    const log = logger.getChildLogger({
      prefix: ["[linkedinsocial/callback]"],
    });
    log.info("LinkedIn accessToken response status", { status: resp.status });
    return resp.data;
  } catch (err) {
    const log = logger.getChildLogger({ prefix: ["[linkedinsocial/callback]"] });
    const status = (err as any)?.response?.status;
    const data = (err as any)?.response?.data;
    // Avoid logging the full params which may include the code/secret; only log masked summary
    log.error("Error fetching LinkedIn access token", {
      message: (err as any)?.message ?? String(err),
      status,
      // Include response body to diagnose 400 errors from LinkedIn (scopes, redirect_uri, etc.)
      responseBody: data,
    });
    throw err;
  }
}
