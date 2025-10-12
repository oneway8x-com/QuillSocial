/**
 * Common types for social search providers
 * Enables extensibility for X, Threads, etc.
 */

export interface NormalizedPost {
  id: string;
  authorId: string;
  authorHandle: string;
  authorName?: string;
  text: string;
  likeCount: number;
  replyCount: number;
  lang?: string;
  createdAt?: Date;
}

export interface SearchHashtagParams {
  hashtags: string[];
  max: number;
  lang?: string;
  minLikes?: number;
  minReplies?: number;
  excludeKeywords?: string[];
  nextToken?: string;
}

export interface SearchHashtagResult {
  posts: NormalizedPost[];
  nextToken?: string;
  readsConsumed: number;
}

export interface ReplyResult {
  id: string;
  url: string;
}

/**
 * Common interface for social search providers
 * Implement this for X, Threads, etc.
 */
export interface SocialSearchProvider {
  /**
   * Search for posts by hashtags
   */
  searchHashtag(params: SearchHashtagParams): Promise<SearchHashtagResult>;

  /**
   * Check if the authenticated user is following an author
   * @param authorId - The author's platform-specific ID
   */
  isFollowing(authorId: string): Promise<boolean>;

  /**
   * Batch check following status for multiple authors
   */
  batchIsFollowing(authorIds: string[]): Promise<Map<string, boolean>>;

  /**
   * Reply to a post
   * @param postId - The post ID to reply to
   * @param text - The reply text
   */
  replyTo(postId: string, text: string): Promise<ReplyResult>;
}
