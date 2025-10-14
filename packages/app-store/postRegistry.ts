/**
 * Post Function Registry
 *
 * Centralized registry for social media platform post functions.
 * To add a new platform:
 * 1. Import the manager/post function
 * 2. Add entry to POST_HANDLERS mapping
 * 3. That's it! No need to modify cron code.
 */

import { FacebookManager } from "@quillsocial/app-store/facebooksocial/lib";
import { InstagramManager } from "@quillsocial/app-store/instagramsocial/lib";
import { LinkedinManager } from "@quillsocial/app-store/linkedinsocial/lib";
import { ThreadsManager } from "@quillsocial/app-store/threadssocial/lib";
import { post as xPost } from "@quillsocial/app-store/xconsumerkeyssocial/lib";

/**
 * Type definition for a post handler function
 */
export type PostHandler = (postId: number) => Promise<any>;

/**
 * Registry mapping app IDs to their post handler functions
 *
 * Add new platforms here when implementing new social integrations
 */
export const POST_HANDLERS: Record<string, PostHandler> = {
  "linkedin-social": LinkedinManager.post,
  "xconsumerkeys-social": xPost,
  "facebook-social": FacebookManager.post,
  "instagram-social": InstagramManager.post,
  "threads-social": ThreadsManager.post,
};

/**
 * Get the post handler for a given app ID
 *
 * @param appId - The app slug (e.g., "linkedin-social")
 * @returns The post handler function or undefined if not found
 */
export function getPostHandler(appId: string): PostHandler | undefined {
  return POST_HANDLERS[appId];
}

/**
 * Check if an app ID has a post handler
 *
 * @param appId - The app slug
 * @returns true if the app has a registered post handler
 */
export function hasPostHandler(appId: string): boolean {
  return appId in POST_HANDLERS;
}

/**
 * Get all registered app IDs that support posting
 *
 * @returns Array of app IDs with post handlers
 */
export function getSupportedPostApps(): string[] {
  return Object.keys(POST_HANDLERS);
}

/**
 * Execute a post for a given app ID
 *
 * @param appId - The app slug
 * @param postId - The post ID to publish
 * @returns The result from the post handler
 * @throws Error if app ID is not supported
 */
export async function executePost(appId: string, postId: number): Promise<any> {
  const handler = getPostHandler(appId);

  if (!handler) {
    throw new Error(`Unsupported app: ${appId}. Supported apps: ${getSupportedPostApps().join(", ")}`);
  }

  return handler(postId);
}
