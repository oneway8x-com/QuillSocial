export const WEBAPP_URL =
  process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.quillsocial.com";
/** @deprecated use `WEBAPP_URL` */
export const BASE_URL = WEBAPP_URL;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "QuillAI";
export const SUPPORT_MAIL_ADDRESS =
  process.env.NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS || "help@quillsocial.com";
export const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME || "QuillAI, Inc.";
export const SENDER_ID = process.env.NEXT_PUBLIC_SENDER_ID || "QuillAI";
export const SENDER_NAME =
  process.env.NEXT_PUBLIC_SENDGRID_SENDER_NAME || "QuillAI";

// This is the URL from which all Quill Links and their assets are served.
// Use website URL to make links shorter(quillsocial.com and not app.quillsocial.com)
// As website isn't setup for preview environments, use the webapp url instead
export const MY_APP_URL = WEBAPP_URL;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const TRIAL_LIMIT_DAYS = 14;
/** @deprecated use `WEBAPP_URL` */
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_WEBAPP_URL;
export const LOGO = "/img/logo.png";
export const LOGO_ICON = "/img/logo.png";
export const FAVICON_16 = "/favicon-16x16.png";
export const FAVICON_32 = "/favicon-32x32.png";
export const APPLE_TOUCH_ICON = "/apple-touch-icon.png";
export const MSTILE_ICON = "/mstile-150x150.png";
export const ANDROID_CHROME_ICON_192 = "/android-chrome-192x192.png";
export const ANDROID_CHROME_ICON_256 = "/android-chrome-256x256.png";
export const ROADMAP = "https://quillsocial.com/roadmap";
export const DESKTOP_APP_LINK = "https://quillsocial.com/download";
export const JOIN_SLACK = "https://quillsocial.com/slack";
export const POWERED_BY_URL = `${WEBAPP_URL}/?utm_source=embed&utm_medium=powered-by-button`;
export const DOCS_URL = "https://quillsocial.com/docs";
export const DEVELOPER_DOCS = "https://developer.quillsocial.com";
export const SEO_IMG_DEFAULT = `${WEBAPP_URL}/og-image.png`;
export const SEO_IMG_OGIMG = `${MY_APP_URL}/_next/image?w=1200&q=100&url=${encodeURIComponent(
  "/api/social/og/image"
)}`;
export const SEO_IMG_OGIMG_VIDEO = `${WEBAPP_URL}/video-og-image.png`;
export const IS_STRIPE_ENABLED = !!(
  process.env.STRIPE_CLIENT_ID &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY &&
  process.env.STRIPE_PRIVATE_KEY
);
/** Self hosted shouldn't checkout when creating teams unless required */
export const IS_TEAM_BILLING_ENABLED = false;
export const FULL_NAME_LENGTH_MAX_LIMIT = 50;
export const MINUTES_TO_BOOK = process.env.NEXT_PUBLIC_MINUTES_TO_BOOK || "5";

// Needed for orgs
// Helper to parse list-style env vars. Supports:
// 1. Comma or semicolon separated list: foo.com,bar.com
// 2. JSON array: ["foo.com","bar.com"]
// 3. Legacy single quoted segments: 'foo.com','bar.com'
// Any invalid input results in an empty array rather than throwing at module import time.
const parseStringArrayEnv = (name: string): string[] => {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  // If already a JSON array attempt to parse directly
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (e) {
      console.warn(
        `Invalid JSON array provided for ${name}, falling back to delimiter parsing.`
      );
    }
  }
  // Split on commas / semicolons
  return trimmed
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^['"]|['"]$/g, "")); // remove wrapping quotes
};

export const ALLOWED_HOSTNAMES = parseStringArrayEnv("ALLOWED_HOSTNAMES");
export const RESERVED_SUBDOMAINS = parseStringArrayEnv("RESERVED_SUBDOMAINS");

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID;

export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
export const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
export const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
export const AZURE_OPENAI_VERSION = process.env.AZURE_OPENAI_VERSION;
export const AZURE_OPENAI_DEPLOYMENT_ID =
  process.env.AZURE_OPENAI_DEPLOYMENT_ID!;

export const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
export const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

export const LINKEDIN_SCOPES =
  "rw_ads rw_organization_admin w_organization_social profile email w_member_social openid";

export const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
export const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
export const TWITTER_APP_ID = "xconsumerkeys-social";
export const IS_SELF_HOSTED = !(
  new URL(WEBAPP_URL).hostname.endsWith(".app.quillsocial.com") ||
  new URL(WEBAPP_URL).hostname.endsWith(".quillsocial.com")
);
