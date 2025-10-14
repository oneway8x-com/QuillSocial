import { symmetricDecrypt } from "@quillsocial/lib/crypto";
import prisma from "@quillsocial/prisma";
import axios from "axios";

const GRAPH = "https://graph.threads.net/v1.0";

// tiny helper: POST form-encoded to Graph
const postForm = async (url: string, body: Record<string, string>) => {
  const form = new URLSearchParams(body);
  return axios.post(url, form.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const post = async (postId: number) => {
  console.debug("[threadsManager] post() start", { postId });
  const postRec = await prisma.post.findUnique({ where: { id: postId } });
  console.debug("[threadsManager] fetched post", { postId, found: !!postRec });
  if (!postRec || !postRec.credentialId) {
    console.trace(
      "[threadsManager] aborting post(): missing post or credentialId",
      {
        postId,
        postPresent: !!postRec,
        credentialId: postRec?.credentialId,
      }
    );
    return false;
  }

  const credential = await prisma.credential.findUnique({
    where: { id: postRec.credentialId },
  });
  console.debug("[threadsManager] fetched credential", {
    credentialId: postRec.credentialId,
    credential: credential,
  });
  if (!credential) {
    console.error("Error posting threads status: credential is null", {
      postId,
      credentialId: postRec.credentialId,
    });
    return false;
  }

  // Parse the credential key to get access token and user ID
  let accessToken: string | undefined;
  let userId: string | undefined;
  try {
    let rawKey: any = credential.key as any;

    try {
      rawKey = JSON.parse(rawKey);
    } catch {
      try {
        accessToken = rawKey.access_token;
        userId = rawKey.user_id || undefined;
      } catch (e) {
        console.error("Error parsing Threads credential key", e, {
          credentialId: credential.id,
        });
      }
    }

    console.debug("[threadsManager] credential parsing result", {
      credentialId: credential.id,
      accessToken: accessToken,
      userId,
    });
  } catch (e) {
    console.error("Error parsing Threads credential key", e, {
      credentialId: credential.id,
    });
  }

  console.debug("[threadsManager] credential parsing result", {
    credentialId: credential.id,
    accessTokenPresent: !!accessToken,
    userId,
  });

  if (!accessToken) {
    console.error("Error posting threads status: accessToken is null", {
      postId,
      credentialId: credential.id,
    });
    return false;
  }

  // Using "me" is supported by Threads; no need to resolve numeric ID. :contentReference[oaicite:4]{index=4}
  const user = userId || "me";

  try {
    console.debug("[threadsManager] creating post", {
      postId,
      userId: user,
      hasImages: !!postRec.imagesDataURL?.length,
    });

    const images = (postRec.imagesDataURL as string[]) || [];
    let threadsResult: any;

    if (images.length > 0) {
      // Validate URLs (Threads requires publicly accessible URLs)
      const bad = images.find((u) => !/^https?:\/\//i.test(u));
      if (bad) {
        throw new Error(
          "Threads requires public media URLs (no data URIs). Upload media to storage and provide HTTPS URLs."
        );
      }
      threadsResult =
        images.length === 1
          ? await createSingleMediaPost(
              user,
              accessToken,
              postRec.content,
              images[0]
            )
          : await createCarouselPost(
              user,
              accessToken,
              postRec.content,
              images
            );
    } else {
      threadsResult = await createTextPost(user, accessToken, postRec.content);
    }

    if (threadsResult) {
      await prisma.post.update({
        where: { id: postRec.id },
        data: {
          result: threadsResult,
          status: "POSTED",
          postedDate: new Date(),
        },
      });
      console.debug("[threadsManager] post successful", {
        postId,
        threadId: threadsResult.id,
        permalink: threadsResult.permalink,
      });
      return threadsResult;
    } else {
      await prisma.post.update({
        where: { id: postRec.id },
        data: { status: "ERROR" },
      });
      console.trace("[threadsManager] post failed - threadsResult falsy", {
        postId,
      });
      return false;
    }
  } catch (error: any) {
    console.error(
      "Error posting threads status:",
      error.response?.data || error.message,
      {
        postId,
      }
    );
    await prisma.post.update({
      where: { id: postRec.id },
      data: { status: "ERROR" },
    });
    return false;
  }
};

/**
 * Search for public Threads media by keyword or topic tag
 *
 * @param credentialId - The credential ID for authentication
 * @param options - Search options
 * @returns Search results or null on error
 */
export const searchByKeyword = async (
  credentialId: number,
  options: {
    query: string;
    searchType?: "TOP" | "RECENT";
    searchMode?: "KEYWORD" | "TAG";
    mediaType?: "TEXT" | "IMAGE" | "VIDEO";
    since?: number; // Unix timestamp
    until?: number; // Unix timestamp
    limit?: number; // Max 100, default 25
    fields?: string[]; // Fields to return
  }
) => {
  console.debug("[threadsManager] searchByKeyword() start", {
    credentialId,
    options,
  });

  // Fetch credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    console.error("Error searching Threads: credential not found", {
      credentialId,
    });
    return null;
  }

  // Parse the credential key to get access token
  let accessToken: string | undefined;
  try {
    let rawKey: any = credential.key as any;

    try {
      rawKey = JSON.parse(rawKey);
    } catch {
      try {
        accessToken = rawKey.access_token;
      } catch (e) {
        console.error("Error parsing Threads credential key", e, {
          credentialId: credential.id,
        });
      }
    }

    console.debug("[threadsManager] credential parsing result", {
      credentialId: credential.id,
      accessTokenPresent: !!accessToken,
    });
  } catch (e) {
    console.error("Error parsing Threads credential key", e, {
      credentialId: credential.id,
    });
  }

  if (!accessToken) {
    console.error("Error searching Threads: accessToken is null", {
      credentialId: credential.id,
    });
    return null;
  }

  try {
    // Build query parameters
    const params: Record<string, string> = {
      q: options.query,
      access_token: accessToken,
    };

    // Add optional parameters
    if (options.searchType) {
      params.search_type = options.searchType;
    }

    if (options.searchMode) {
      params.search_mode = options.searchMode;
    }

    if (options.mediaType) {
      params.media_type = options.mediaType;
    }

    if (options.since) {
      params.since = options.since.toString();
    }

    if (options.until) {
      params.until = options.until.toString();
    }

    if (options.limit) {
      params.limit = Math.min(options.limit, 100).toString();
    }

    // Default fields if not provided
    const fields = options.fields?.length
      ? options.fields.join(",")
      : "id,text,media_type,permalink,timestamp,username,has_replies,is_quote_post,is_reply";

    params.fields = fields;

    console.debug("[threadsManager] searching with params", { params });

    // Make the API request
    const { data } = await axios.get(`${GRAPH}/keyword_search`, { params });

    console.debug("[threadsManager] search successful", {
      resultCount: data?.data?.length || 0,
    });

    return data;
  } catch (error: any) {
    console.error(
      "Error searching Threads:",
      error.response?.data || error.message,
      {
        credentialId,
        query: options.query,
      }
    );
    return null;
  }
};

/**
 * Get recently searched keywords for the authenticated user
 *
 * @param credentialId - The credential ID for authentication
 * @returns Recently searched keywords or null on error
 */
export const getRecentlySearchedKeywords = async (credentialId: number) => {
  console.debug("[threadsManager] getRecentlySearchedKeywords() start", {
    credentialId,
  });

  // Fetch credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    console.error(
      "Error fetching recently searched keywords: credential not found",
      {
        credentialId,
      }
    );
    return null;
  }

  // Parse the credential key to get access token
  let accessToken: string | undefined;
  try {
    let rawKey: any = credential.key as any;

    try {
      rawKey = JSON.parse(rawKey);
    } catch {
      try {
        accessToken = rawKey.access_token;
      } catch (e) {
        console.error("Error parsing Threads credential key", e, {
          credentialId: credential.id,
        });
      }
    }
  } catch (e) {
    console.error("Error parsing Threads credential key", e, {
      credentialId: credential.id,
    });
  }

  if (!accessToken) {
    console.error(
      "Error fetching recently searched keywords: accessToken is null",
      {
        credentialId: credential.id,
      }
    );
    return null;
  }

  try {
    const { data } = await axios.get(`${GRAPH}/me`, {
      params: {
        fields: "recently_searched_keywords",
        access_token: accessToken,
      },
    });

    console.debug("[threadsManager] recently searched keywords retrieved", {
      keywordCount: data?.recently_searched_keywords?.length || 0,
    });

    return data;
  } catch (error: any) {
    console.error(
      "Error fetching recently searched keywords:",
      error.response?.data || error.message,
      {
        credentialId,
      }
    );
    return null;
  }
};

/**
 * Reply to a Threads post
 *
 * @param credentialId - The credential ID for authentication
 * @param options - Reply options
 * @returns Reply result with id and permalink, or null on error
 */
export const replyToPost = async (
  credentialId: number,
  options: {
    replyToId: string; // The Threads post ID to reply to
    text: string; // Reply text content
    mediaType?: "TEXT" | "IMAGE" | "VIDEO"; // Media type (defaults to TEXT)
    mediaUrl?: string; // Media URL (required if mediaType is IMAGE or VIDEO)
  }
) => {
  console.debug("[threadsManager] replyToPost() start", {
    credentialId,
    replyToId: options.replyToId,
  });

  // Fetch credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    console.error("Error replying to Threads post: credential not found", {
      credentialId,
    });
    return null;
  }

  // Parse the credential key to get access token and user ID
  let accessToken: string | undefined;
  let userId: string | undefined;
  try {
    let rawKey: any = credential.key as any;

    try {
      rawKey = JSON.parse(rawKey);
    } catch {
      try {
        accessToken = rawKey.access_token;
        userId = rawKey.user_id || undefined;
      } catch (e) {
        console.error("Error parsing Threads credential key", e, {
          credentialId: credential.id,
        });
      }
    }

    console.debug("[threadsManager] credential parsing result", {
      credentialId: credential.id,
      accessTokenPresent: !!accessToken,
      userId,
    });
  } catch (e) {
    console.error("Error parsing Threads credential key", e, {
      credentialId: credential.id,
    });
  }

  if (!accessToken) {
    console.error("Error replying to Threads post: accessToken is null", {
      credentialId: credential.id,
    });
    return null;
  }

  // Using "me" is supported by Threads
  const user = userId || "me";

  try {
    // Step 1: Create reply container
    const mediaType = options.mediaType || "TEXT";
    const createParams: Record<string, string> = {
      media_type: mediaType,
      text: options.text,
      reply_to_id: options.replyToId,
      access_token: accessToken,
    };

    // Add media URL if provided and media type is IMAGE or VIDEO
    if (options.mediaUrl && (mediaType === "IMAGE" || mediaType === "VIDEO")) {
      const mediaField = mediaType === "VIDEO" ? "video_url" : "image_url";
      createParams[mediaField] = options.mediaUrl;

      // Validate URL format
      if (!/^https?:\/\//i.test(options.mediaUrl)) {
        throw new Error(
          "Threads requires public media URLs (no data URIs). Upload media to storage and provide HTTPS URLs."
        );
      }
    }

    console.debug("[threadsManager] creating reply container", {
      user,
      replyToId: options.replyToId,
      mediaType,
      hasMediaUrl: !!options.mediaUrl,
    });

    const createResp = await postForm(`${GRAPH}/${user}/threads`, createParams);
    const containerId = createResp.data.id;

    console.debug("[threadsManager] reply container created", {
      containerId,
    });

    // Step 2: If media is involved, wait for it to be processed
    if (options.mediaUrl && (mediaType === "IMAGE" || mediaType === "VIDEO")) {
      console.debug("[threadsManager] waiting for media to be processed", {
        containerId,
      });
      await checkMediaLoaded(containerId, accessToken);
    } else {
      // For text-only replies, wait a short time to ensure processing
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Step 3: Publish the reply
    console.debug("[threadsManager] publishing reply", { containerId });

    const publishResp = await postForm(`${GRAPH}/${user}/threads_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    });

    const replyId = publishResp.data.id;

    console.debug("[threadsManager] reply published successfully", {
      replyId,
    });

    // Step 4: Fetch permalink for the reply
    const linkInfo = await getLinkbyId(replyId, accessToken);

    return {
      id: replyId,
      permalink: linkInfo?.permalink,
    };
  } catch (error: any) {
    console.error(
      "Error replying to Threads post:",
      error.response?.data || error.message,
      {
        credentialId,
        replyToId: options.replyToId,
      }
    );
    return null;
  }
};

// Poll a container until it is ready
async function checkMediaLoaded(
  mediaContainerId: string,
  accessToken: string
): Promise<boolean> {
  console.debug("[threadsManager] checkMediaLoaded", { mediaContainerId });

  const url = `${GRAPH}/${mediaContainerId}`;
  const { data } = await axios.get(url, {
    params: {
      fields: "status,status_code,error_message",
      access_token: accessToken,
    },
  });

  const status = (data?.status || data?.status_code || "")
    .toString()
    .toUpperCase();
  const errMsg = data?.error_message;

  if (status === "ERROR") throw new Error(errMsg || "Media processing failed");
  if (status === "FINISHED") return true;

  await new Promise((r) => setTimeout(r, 2000));
  return checkMediaLoaded(mediaContainerId, accessToken);
}

// Try to fetch permalink for a node id; returns { id, permalink } or null
async function getLinkbyId(id: string, accessToken: string): Promise<{ id: string; permalink?: string } | null> {
  try {
    const { data } = await axios.get(`${GRAPH}/${id}`, {
      params: { fields: "id,permalink", access_token: accessToken },
    });
    return { id: data.id, permalink: data.permalink };
  } catch (error: any) {
    console.debug('[threadsManager] getLinkbyId failed', { id, error: error?.response?.data || error?.message });
    return null;
  }
}

// Create text-only post
async function createTextPost(
  userId: string,
  accessToken: string,
  message: string
) {
  const withRetries = async <T>(
    fn: () => Promise<T>,
    attempts = 3,
    baseDelay = 500
  ): Promise<T> => {
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        console.debug("[threadsManager] attempt", {
          fn: fn.name || "anonymous",
          attempt,
        });
        return await fn();
      } catch (err: any) {
        const errData = err?.response?.data;
        const isTransient =
          errData?.error?.is_transient ?? errData?.is_transient ?? false;
        console.error("[threadsManager] request error", {
          attempt,
          isTransient,
          error: errData || err.message,
        });
        if (attempt >= attempts || !isTransient) throw err;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.debug("[threadsManager] retrying after delay", {
          attempt,
          delay,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  };

  try {
    // Step 1: Create text container (form-encoded) then publish. :contentReference[oaicite:5]{index=5}
    const createResp = await withRetries(() =>
      postForm(`${GRAPH}/me/threads`, {
        media_type: "TEXT",
        text: message,
        access_token: accessToken,
        auto_publish_text: "true",
      })
    );

    console.debug("[threadsManager] createResp", {
      data: createResp.data,
      status: createResp.status,
    });

    const creationId = createResp.data.id;

    return { id: creationId };
  } catch (error: any) {
    console.error(
      "Error creating text post:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Create single media post (image or video)
async function createSingleMediaPost(
  userId: string,
  accessToken: string,
  message: string,
  mediaUrl: string
) {
  try {
    const isVideo =
      /\.(mp4|mov|m4v)(\?|$)/i.test(mediaUrl) || /video/i.test(mediaUrl);
    const mediaType = isVideo ? "VIDEO" : "IMAGE";
    const mediaField = isVideo ? "video_url" : "image_url";

    const createResp = await postForm(`${GRAPH}/${userId}/threads`, {
      media_type: mediaType,
      [mediaField]: mediaUrl,
      text: message,
      access_token: accessToken,
    });

    const creationId = createResp.data.id;
    await checkMediaLoaded(creationId, accessToken);

    const publishResp = await postForm(`${GRAPH}/${userId}/threads_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });

    const threadId = publishResp.data.id;
    const { data: linkData } = await axios.get(`${GRAPH}/${threadId}`, {
      params: { fields: "id,permalink", access_token: accessToken },
    });

    return { id: threadId, permalink: linkData.permalink };
  } catch (error: any) {
    console.error(
      "Error creating single media post:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Create carousel post (multiple media)
async function createCarouselPost(
  userId: string,
  accessToken: string,
  message: string,
  mediaUrls: string[]
) {
  try {
    // 1) Create children items
    const childIds: string[] = [];
    for (const mediaUrl of mediaUrls) {
      const isVideo =
        /\.(mp4|mov|m4v)(\?|$)/i.test(mediaUrl) || /video/i.test(mediaUrl);
      const mediaType = isVideo ? "VIDEO" : "IMAGE";
      const mediaField = isVideo ? "video_url" : "image_url";

      const { data } = await postForm(`${GRAPH}/${userId}/threads`, {
        media_type: mediaType,
        [mediaField]: mediaUrl,
        is_carousel_item: "true",
        access_token: accessToken,
      });

      childIds.push(data.id);
    }

    // 2) Wait for all children
    await Promise.all(childIds.map((id) => checkMediaLoaded(id, accessToken)));

    // 3) Create carousel container (children MUST be comma-separated) :contentReference[oaicite:6]{index=6}
    const carousel = await postForm(`${GRAPH}/${userId}/threads`, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      text: message,
      access_token: accessToken,
    });

    const creationId = carousel.data.id;
    await checkMediaLoaded(creationId, accessToken);

    // 4) Publish
    const publishResp = await postForm(`${GRAPH}/${userId}/threads_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });

    const threadId = publishResp.data.id;
    const { data: linkData } = await axios.get(`${GRAPH}/${threadId}`, {
      params: { fields: "id,permalink", access_token: accessToken },
    });

    return { id: threadId, permalink: linkData.permalink };
  } catch (error: any) {
    console.error(
      "Error creating carousel post:",
      error.response?.data || error.message
    );
    return null;
  }
}
