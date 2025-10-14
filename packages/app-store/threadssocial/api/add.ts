import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import { WEBAPP_URL } from "@quillsocial/lib/constants";
import { makeId } from "@quillsocial/lib/make.is";
import type { NextApiRequest, NextApiResponse } from "next";

let app_id = "";
let app_secret = "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Get app keys (use threads-social slug)
    const appKeys = await getAppKeysFromSlug("threads-social");
    if (typeof appKeys.app_id === "string") app_id = appKeys.app_id;
    if (typeof appKeys.app_secret === "string") app_secret = appKeys.app_secret;
    if (!app_id)
      return res.status(400).json({ message: "Threads app_id missing." });
    if (!app_secret)
      return res.status(400).json({ message: "Threads app_secret missing." });

    // redirect to the server-side callback which will complete the oauth flow
    const redirectUri = WEBAPP_URL + "/api/integrations/threadssocial/callback";

    // Threads scopes (minimal safe default). Allow override via query param.
    const defaultScopes = ["threads_basic", "threads_content_publish", "threads_keyword_search"];
    const scopesParam = (req.query.scopes as string) || defaultScopes.join(",");

    const codeVerifier = makeId(10);
    const state = makeId(6);
    // Build the Threads OAuth URL
    const clientId = process?.env?.THREADS_APP_ID || app_id;
    const oauthUrl =
      `https://threads.net/oauth/authorize?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopesParam)}` +
      `&response_type=code&state=${state}`;

    console.log("THREADS OAUTH URL", oauthUrl);

    // We don't need to call Facebook here; just return the constructed url and the generated state/codeVerifier
    res.status(200).json({ url: oauthUrl, state: state, codeVerifier });
  }
}
