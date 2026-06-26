import { dataURLToStream } from "../../_utils/dataURLToStream";
import { PageInfo } from "../../types";
import { getClient } from "./getClient";
import { PageInfoData } from "./type";
import prisma from "@quillsocial/prisma";
import axios from "axios";
import logger from "@quillsocial/lib/logger";
import { getFile } from "@quillsocial/app-store/googlecloudstorage/lib/getFile";

/** ===== Version handling (REST header: LinkedIn-Version) ===== */
const _rawLinkedInVersion =
  process.env.LINKEDIN_API_VERSION ||
  process.env.LINKEDIN_VERSION ||
  "202509"; // latest (YYYYMM)

function normalizeLinkedInVersion(raw: string) {
  if (!raw) return "202509";
  if (/^\d{6}\.\d+$/.test(raw)) return raw;   // YYYYMM.RR
  if (/^\d{6}$/.test(raw)) return raw;        // YYYYMM
  if (/^\d{8}$/.test(raw)) return raw.substring(0, 6); // YYYYMMDD -> YYYYMM
  const m = raw.match(/(\d{6})/);
  return m ? m[1] : "202509";
}
const LINKEDIN_API_VERSION = normalizeLinkedInVersion(_rawLinkedInVersion);

/** ===== Utilities ===== */
function extractIdFromUrn(urnString: string): string | null {
  const match = urnString?.match(/:(\d+)$/);
  return match ? match[1] : null;
}

function toOrgUrn(idOrUrn: string): string {
  return idOrUrn.startsWith("urn:li:organization:")
    ? idOrUrn
    : `urn:li:organization:${idOrUrn}`;
}

// REST ids param must be URNs; v2 accepts numeric IDs. Build appropriately.
function buildIdsParam(ids: string[], isRest: boolean) {
  const list = isRest ? ids.map(toOrgUrn) : ids;
  return `ids=List(${list.join(",")})`;
}

// v2/shares payload transformer (last-ditch fallback)
function transformToV2ShareFormat(payload: any): any {
  const v2Payload: any = {
    owner: payload.author,
    text: { text: payload.commentary || "" },
    distribution: { linkedInDistributionTarget: {} },
  };
  if (payload.content?.media?.id) {
    v2Payload.content = {
      contentEntities: [{ entity: payload.content.media.id }],
      title: payload.content.media.title || "",
    };
  }
  return v2Payload;
}

/** ===== Generic REST → v2 fallback requester ===== */
async function linkedinApiRequest({
  urlRest,
  urlV2,
  method = "get",
  data,
  token,
  version = LINKEDIN_API_VERSION,
  extraHeaders = {},
}: {
  urlRest: string;
  urlV2?: string;
  method?: "get" | "post";
  data?: any;
  token: string;
  version?: string;
  extraHeaders?: Record<string, string>;
}) {
  const headersRest = {
    Authorization: `Bearer ${token}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": version,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  const headersV2 = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  try {
    if (method === "get") {
      return await axios.get(urlRest, { headers: headersRest });
    } else {
      return await axios.post(urlRest, data, { headers: headersRest });
    }
  } catch (err: any) {
    const status = err?.response?.status;
    // Only fall back for classic “use old surface” signals
    if (status === 426 && urlV2) {
      if (method === "get") {
        return await axios.get(urlV2, { headers: headersV2 });
      } else {
        const v2Data =
          urlV2.includes("/shares") ? transformToV2ShareFormat(data) : data;
        return await axios.post(urlV2, v2Data, { headers: headersV2 });
      }
    }
    throw err;
  }
}

/** ===== Main post flow ===== */
export const post = async (postId: number) => {
  try {
    const linkedInPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        cloudFiles: {
          include: {
            cloudFile: true
          }
        }
      }
    });
    if (!linkedInPost?.credentialId) return false;

    // Check if this is a PDF document post
    const pdfFile = linkedInPost.cloudFiles
      ?.map((pcf) => pcf.cloudFile)
      .find((cf) => cf?.fileExt === "pdf");

    if (pdfFile) {
      console.log("[LinkedinManager.post] Detected PDF file, routing to postPdf");
      return await postPdf(postId, linkedInPost.credentialId, linkedInPost.title || undefined);
    }

    const accessToken = await getClient(linkedInPost.credentialId);
    if (!accessToken) {
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    // Resolve author URN (page or person)
    let authorUrn = linkedInPost.pageId;
    if (!authorUrn) {
      const me = await getUserProfile(accessToken as string);
      authorUrn = `urn:li:person:${me.sub}`;
    }

    const images: string[] = Array.isArray(linkedInPost.imagesDataURL)
      ? (linkedInPost.imagesDataURL as string[])
      : [];
    const imgSrc = images[0] || "";

    const contentRaw = linkedInPost.content || "";
    // Basic escape for (){}[] and markdown-ish symbols to avoid unintended formatting
    const content = contentRaw.replace(/([\(\)\{\}\[\]@*<>\\_~])/g, "\\$1");

    const response = await createLinkedInPost(
      accessToken as string,
      content,
      imgSrc,
      authorUrn
    );

    if (!response) {
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "POSTED",
        postedDate: new Date(),
        result: { shareId: response },
      },
    });
    return true;
  } catch (error) {
    await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
    console.error(error);
    return false;
  }
};

/** ===== Post PDF flow ===== */
export const postPdf = async (postId: number, credentialId: number, title?: string) => {
  try {
    console.log("[postPdf] Starting PDF post flow", { postId, credentialId, title });

    const linkedInPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        cloudFiles: { include: { cloudFile: true } },
      },
    });

    console.log("[postPdf] Post found", {
      hasPost: !!linkedInPost,
      providedCredentialId: credentialId,
      cloudFilesCount: linkedInPost?.cloudFiles?.length
    });

    if (!linkedInPost) {
      console.log("[postPdf] Post not found");
      return false;
    }

    // find associated PDF cloud file
    const pdfCf = linkedInPost.cloudFiles?.map((pcf) => pcf.cloudFile).find((cf) => cf?.fileExt === "pdf");

    console.log("[postPdf] PDF CloudFile search", {
      found: !!pdfCf,
      cloudFileId: pdfCf?.cloudFileId,
      fileExt: pdfCf?.fileExt
    });

    if (!pdfCf) {
      console.log("[postPdf] No PDF cloud file found");
      return false;
    }

    // Get signed URL for PDF
    const pdfFileName = `${pdfCf.cloudFileId}.${pdfCf.fileExt}`;
    console.log("[postPdf] Getting signed URL for", pdfFileName);

    const signedUrl = await getFile(pdfFileName);

    console.log("[postPdf] Signed URL result", { hasUrl: !!signedUrl });

    if (!signedUrl) {
      console.log("[postPdf] Failed to get signed URL");
      return false;
    }

    const accessToken = await getClient(credentialId);

    console.log("[postPdf] Access token retrieved", { hasToken: !!accessToken });

    if (!accessToken) {
      console.log("[postPdf] No access token");
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    // Get credential to check for pageId
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    // Resolve author URN (page or person)
    let authorUrn = credential?.currentPageId || linkedInPost.pageId;
    if (!authorUrn) {
      const me = await getUserProfile(accessToken as string);
      authorUrn = `urn:li:person:${me.sub}`;
    }

    console.log("[postPdf] Author URN", { authorUrn });

    // Download PDF from GCS to upload to LinkedIn
    console.log("[postPdf] Downloading PDF from GCS");
    const pdfResponse = await axios.get(signedUrl, { responseType: "arraybuffer" });
    const pdfBuffer = Buffer.from(pdfResponse.data);

    console.log("[postPdf] PDF downloaded, size:", pdfBuffer.length);

    // Initialize document upload on LinkedIn
    console.log("[postPdf] Initializing LinkedIn document upload");
    const uploadData = await initializeDocumentUpload(
      accessToken as string,
      authorUrn,
      title || linkedInPost.idea || "Document",
      pdfBuffer.length
    );

    const uploadUrl = uploadData?.value?.uploadUrl;
    const documentUrn = uploadData?.value?.document as string;

    console.log("[postPdf] Upload initialized", { hasUploadUrl: !!uploadUrl, documentUrn });

    if (!uploadUrl || !documentUrn) {
      console.log("[postPdf] Failed to initialize document upload");
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    // Upload the PDF binary to LinkedIn
    console.log("[postPdf] Uploading PDF to LinkedIn");
    const uploadSuccess = await uploadDocument(accessToken as string, pdfBuffer, uploadUrl);

    if (!uploadSuccess) {
      console.log("[postPdf] Failed to upload PDF");
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    console.log("[postPdf] PDF uploaded successfully");

    // Build post payload with the uploaded document
    const postData: any = {
      author: authorUrn,
      commentary: linkedInPost.content || "",
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      content: {
        media: {
          title: title || linkedInPost.idea || "",
          id: documentUrn,
        },
      },
    };

    console.log("[postPdf] Creating LinkedIn post with document:", {
      title: title || linkedInPost.idea,
      documentUrn
    });

    const response = await postLinkedInPost(accessToken as string, postData);

    console.log("[postPdf] LinkedIn API response", { hasResponse: !!response, response });

    if (!response) {
      console.log("[postPdf] LinkedIn post failed");
      await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
      return false;
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "POSTED",
        postedDate: new Date(),
        result: { shareId: response },
      },
    });

    console.log("[postPdf] Successfully posted PDF to LinkedIn");
    return true;
  } catch (error) {
    console.error("[postPdf] Error in postPdf flow:", error);
    await prisma.post.update({ where: { id: postId }, data: { status: "ERROR" } });
    return false;
  }
};

/** ===== Organizations (pages) ===== */
export async function getLinkedInPages(accessToken: string) {
  // Try REST first
  let url =
    "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR";
  let headers: any = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "Content-Type": "application/json",
  };
  let pagesResponse;
  let isRest = true;

  const log = logger.getChildLogger({ prefix: ["[linkedinsocial/manager]"] });
  try {
    pagesResponse = await axios.get(url, { headers });
  } catch (err: any) {
    const status = err?.response?.status;
    const respData = err?.response?.data;
    log.warn("LinkedIn organizationAcls request failed", {
      url,
      status,
      data: respData,
    });

    if (status === 426) {
      // Fallback to v2
      url =
        "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR";
      headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
      try {
        pagesResponse = await axios.get(url, { headers });
        isRest = false;
      } catch (err2: any) {
        log.error("LinkedIn organizationAcls v2 fallback failed", {
          url,
          status: err2?.response?.status,
          data: err2?.response?.data,
        });
        // If v2 fallback also fails with permission/400-series, treat as no pages instead of throwing
        if ([400, 401, 403, 404].includes(err2?.response?.status)) {
          return [];
        }
        throw err2;
      }
    } else if ([400, 401, 403, 404].includes(status)) {
      // Common case: token lacks organization scopes or account has no org admin rights.
      // Don't throw — return empty list so personal profile can still be saved.
      return [];
    } else {
      throw err;
    }
  }
  if (pagesResponse.status !== 200) return undefined;

  const pages: string[] =
    pagesResponse.data?.elements?.map((x: any) => extractIdFromUrn(x.organization)) || [];

  if (!pages.length) return [];

  const orgApiBase = isRest
    ? "https://api.linkedin.com/rest/organizations"
    : "https://api.linkedin.com/v2/organizations";

  const pageDetailUrl = `${orgApiBase}?${buildIdsParam(pages, isRest)}`;
  let pageDetailsResponse;
  try {
    pageDetailsResponse = await axios.get(pageDetailUrl, { headers });
    if (pageDetailsResponse.status !== 200) return undefined;
  } catch (err: any) {
    log.warn("LinkedIn organization details request failed", {
      url: pageDetailUrl,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    // If access denied or bad request regarding org details, assume no pages
    if ([400, 401, 403, 404].includes(err?.response?.status)) return [];
    throw err;
  }

  const data = pageDetailsResponse.data as PageInfoData;
  const results = (isRest ? data.results : data) as any;

  const pageInfoes: PageInfo[] = Object.values(results).map((org: any) => ({
    id: `urn:li:organization:${org.id}`,
    name: org.vanityName || org.localizedName || `Organization ${org.id}`,
    isCurrent: false,
    info: org,
  }));

  return pageInfoes;
}

/** ===== Posting (REST posts) ===== */
async function createLinkedInPost(
  accessToken: string,
  postContent: string,
  imgSrc: string,
  author: string
): Promise<string | boolean> {
  let postData: any = {
    author,
    commentary: postContent,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  try {
    if (imgSrc) {
      const uploadData = await initializeUpload(accessToken, author);
      const uploadUrl = uploadData?.value?.uploadUrl;
      const imageUrn = uploadData?.value?.image as string;

      await uploadImage(accessToken, imgSrc, uploadUrl);

      postData = {
        ...postData,
        content: {
          media: {
            title: "",
            id: imageUrn,
          },
        },
        isReshareDisabledByAuthor: false,
      };
    }

    const response = await postLinkedInPost(accessToken, postData);
    return response;
  } catch (error: any) {
    console.error(
      "Error creating post:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
}

const initializeUpload = async (accessToken: string, owner: string) => {
  const url = "https://api.linkedin.com/rest/images?action=initializeUpload";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
  const data = { initializeUploadRequest: { owner } };
  const response = await axios.post(url, data, { headers });
  return response.data;
};

const uploadImage = async (token: string, imgSrc: string, uploadUrl: string) => {
  // Most LinkedIn upload URLs are pre-signed; auth header is usually unnecessary, but harmless.
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "image/png" };
  const fileStream = dataURLToStream(imgSrc);
  const response = await axios.post(uploadUrl, fileStream, { headers });
  return response.status === 201;
};

/** ===== Document Upload (for PDF carousel) ===== */
const initializeDocumentUpload = async (
  accessToken: string,
  owner: string,
  title: string,
  fileSizeBytes: number
) => {
  const url = "https://api.linkedin.com/rest/documents?action=initializeUpload";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  // Per LinkedIn Documents API documentation, only owner is required
  // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/documents-api
  const data = {
    initializeUploadRequest: {
      owner,
    },
  };

  console.log("[initializeDocumentUpload] Request data:", JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(url, data, { headers });
    console.log("[initializeDocumentUpload] Success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[initializeDocumentUpload] Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      errorDetails: JSON.stringify(error.response?.data?.errorDetails, null, 2),
      requestData: data
    });
    throw error;
  }
};

const uploadDocument = async (token: string, pdfBuffer: Buffer, uploadUrl: string) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/pdf",
  };
  const response = await axios.put(uploadUrl, pdfBuffer, { headers });
  return response.status === 200 || response.status === 201;
};

async function postLinkedInPost(token: string, postData: any) {
  try {
    const response = await linkedinApiRequest({
      urlRest: "https://api.linkedin.com/rest/posts",
      urlV2: "https://api.linkedin.com/v2/shares",
      method: "post",
      data: postData,
      token,
      version: LINKEDIN_API_VERSION,
    });

    if (response.status === 201) {
      const shareId =
        response.headers["x-restli-id"] || response.headers["x-linkedin-id"];
      return shareId || true;
    }
    return false;
  } catch (error: any) {
    console.error(
      "Error posting to LinkedIn:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
}

/** ===== Me (OAuth userinfo) ===== */
export async function getUserProfile(accessToken: string) {
  const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
