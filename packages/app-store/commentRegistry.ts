/**
 * Comment/Reply Function Registry
 *
 * Centralized registry for social media platform comment/reply functions.
 * To add a new platform:
 * 1. Import the reply/comment function
 * 2. Add entry to COMMENT_HANDLERS mapping
 * 3. That's it! No need to modify cron code.
 */

import { replyToTweet } from "@quillsocial/app-store/xconsumerkeyssocial/lib";

/**
 * Type definition for a comment handler function
 *
 * @param credentialId - The credential ID to use for authentication
 * @param parentId - The parent post/tweet ID to reply to
 * @param content - The comment/reply content
 * @returns Result object with success status
 */
export type CommentHandler = (
  credentialId: number,
  parentId: string,
  content: string
) => Promise<{ success: boolean; [key: string]: any }>;

/**
 * Registry mapping app IDs to their comment handler functions
 *
 * Add new platforms here when implementing new comment/reply integrations
 */
export const COMMENT_HANDLERS: Record<string, CommentHandler> = {
  "xconsumerkeys-social": replyToTweet,
  // Add other platforms as they implement comment functionality:
  // "linkedin-social": linkedinReply,
  // "facebook-social": facebookComment,
  // "instagram-social": instagramComment,
  // "threads-social": threadsReply,
};

/**
 * Get the comment handler for a given app ID
 *
 * @param appId - The app slug (e.g., "xconsumerkeys-social")
 * @returns The comment handler function or undefined if not found
 */
export function getCommentHandler(appId: string): CommentHandler | undefined {
  return COMMENT_HANDLERS[appId];
}

/**
 * Check if an app ID has a comment handler
 *
 * @param appId - The app slug
 * @returns true if the app has a registered comment handler
 */
export function hasCommentHandler(appId: string): boolean {
  return appId in COMMENT_HANDLERS;
}

/**
 * Get all registered app IDs that support commenting
 *
 * @returns Array of app IDs with comment handlers
 */
export function getSupportedCommentApps(): string[] {
  return Object.keys(COMMENT_HANDLERS);
}

/**
 * Execute a comment/reply for a given app ID
 *
 * @param appId - The app slug
 * @param credentialId - The credential ID
 * @param parentId - The parent post ID
 * @param content - The comment content
 * @returns The result from the comment handler
 * @throws Error if app ID is not supported
 */
export async function executeComment(
  appId: string,
  credentialId: number,
  parentId: string,
  content: string
): Promise<{ success: boolean; [key: string]: any }> {
  const handler = getCommentHandler(appId);

  if (!handler) {
    throw new Error(
      `Comment not supported for app: ${appId}. Supported apps: ${getSupportedCommentApps().join(", ")}`
    );
  }

  return handler(credentialId, parentId, content);
}

/**
 * Get platforms that don't support comments yet
 * Useful for logging/tracking which platforms need implementation
 */
export const PLATFORMS_WITHOUT_COMMENT_SUPPORT = [
  "linkedin-social",
  "facebook-social",
  "instagram-social",
  "threads-social",
] as const;
