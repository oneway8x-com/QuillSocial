# Threads Connect API Integration

## Overview

This document describes the integration of actual Threads Graph API calls into the Threads Connect feature.

## Changes Made

### 1. Start Scan - Hashtag Search Implementation

**Location**: `packages/trpc/server/routers/viewer/threadsConnect.ts` - `startScan` procedure

**What Changed**:
- Removed placeholder/simulated search results
- Implemented actual API calls using `threadsManager.searchByKeyword()`
- Search each hashtag individually using Threads Graph API
- Map API response fields to database schema

**API Integration Details**:

```typescript
// For each hashtag, call the search API
const searchResult = await threadsManager.searchByKeyword(credential.id, {
  query: hashtag,
  searchType: "RECENT",     // Get most recent posts
  searchMode: "TAG",         // Search by hashtag tag
  limit: maxPerHashtag,      // Distributed across hashtags
  fields: [
    "id",
    "text", 
    "media_type",
    "permalink",
    "timestamp",
    "username",
    "like_count",
    "reply_count"
  ],
});
```

**Field Mapping**:
- `post.id` → `threadsPostId`
- `post.username` → `authorId`, `authorHandle`, `authorName` (API doesn't return separate display name)
- `post.text` → `text`
- `post.like_count` → `likeCount`
- `post.reply_count` → `replyCount`
- `settings.language` → `lang` (fallback, API doesn't return language in search results)
- `authorIsFollowed` → Always `false` (API doesn't return this info in search)

**Filtering Applied**:
1. Duplicate check (already in database)
2. Minimum likes threshold
3. Minimum replies threshold
4. Excluded keywords check

**Reads Tracking**:
- Each post returned counts as 1 read
- `readsConsumed = allResults.length`
- Updates `threadsUsageCounter.readsUsed`

### 2. Comment on Post - Reply Implementation

**Location**: `packages/trpc/server/routers/viewer/threadsConnect.ts` - `commentOnPost` procedure

**What Changed**:
- Removed placeholder/simulated comment posting
- Implemented actual API call using `threadsManager.replyToPost()`
- Proper error handling with fallback to SKIPPED status

**API Integration Details**:

```typescript
const result = await threadsManager.replyToPost(credential.id, {
  replyToId: threadsPostId,
  text: comment,
  mediaType: "TEXT",
});
```

**Response Handling**:
- Returns `{ id: replyId, permalink: replyPermalink }` on success
- Returns `null` on error
- Marks post as `ENGAGED` on success
- Marks post as `SKIPPED` on error

**API Process** (handled by threadsManager):
1. Create reply container with text and `reply_to_id`
2. Wait for processing (2 seconds for text-only)
3. Publish the reply
4. Fetch permalink for the reply

**Rate Limiting**:
- Checks daily limit (default: 20)
- Checks 3-hour window limit (300)
- Updates `threadsUsageCounter.postsUsed`

## Threads Manager Functions Used

### `searchByKeyword(credentialId, options)`

**Purpose**: Search for public Threads media by keyword or hashtag

**Parameters**:
- `credentialId` - Database ID of Threads credential
- `options`:
  - `query` - Search term (hashtag without #)
  - `searchType` - "TOP" or "RECENT"
  - `searchMode` - "KEYWORD" or "TAG"
  - `limit` - Max 100, default 25
  - `fields` - Array of fields to return
  - `since`, `until` - Unix timestamps (optional)
  - `mediaType` - "TEXT", "IMAGE", "VIDEO" (optional)

**Returns**: 
```typescript
{
  data: Array<{
    id: string;
    text: string;
    username: string;
    like_count?: number;
    reply_count?: number;
    // ... other fields
  }>;
  paging?: { next?: string; previous?: string; };
}
```

### `replyToPost(credentialId, options)`

**Purpose**: Post a reply to a Threads post

**Parameters**:
- `credentialId` - Database ID of Threads credential
- `options`:
  - `replyToId` - Threads post ID to reply to
  - `text` - Reply text content
  - `mediaType` - "TEXT", "IMAGE", "VIDEO" (defaults to TEXT)
  - `mediaUrl` - Required for IMAGE/VIDEO (must be HTTPS URL)

**Returns**:
```typescript
{
  id: string;         // New reply post ID
  permalink: string;  // URL to the reply
} | null
```

## Important Notes

### API Limitations

1. **Search Results**: The Threads Graph API may not return `like_count` and `reply_count` for all posts depending on permissions and API version
2. **Author Information**: Only `username` is available in search results, not display name or user ID
3. **Follow Status**: Cannot determine if user follows an author from search results
4. **Language Detection**: API doesn't return language, must use settings as fallback

### Rate Limits

According to Threads Graph API documentation:
- **Daily**: 20 posts (configurable in settings)
- **3-hour window**: 300 posts (hard limit)
- **Monthly reads**: 100 (configurable in settings)
- **Monthly posts**: 500 (configurable in settings)

### Error Handling

- API errors are caught and logged with full context
- Failed searches don't crash the scan, just log warnings
- Failed comments mark post as SKIPPED
- All errors preserve user ID and post ID for debugging

### Logging

Comprehensive logging added for:
- API call parameters
- Response data (counts, results)
- Field mapping process
- Filter application
- Database operations
- Error details with context

## Testing Recommendations

1. **Search Testing**:
   - Test with various hashtags
   - Verify filtering (minLikes, minReplies, keywords)
   - Check usage counter updates
   - Test with read limit near cap

2. **Comment Testing**:
   - Test successful comment posting
   - Verify rate limit enforcement
   - Test error handling (invalid post ID, credential issues)
   - Check status updates (ENGAGED/SKIPPED)

3. **Credential Testing**:
   - Test with expired/invalid tokens
   - Verify error messages guide user to reconnect

## Future Improvements

1. **Batch Processing**: Consider batching hashtag searches if API supports it
2. **Pagination**: Implement pagination for search results if needed
3. **Retry Logic**: Add exponential backoff for API errors
4. **Webhooks**: Consider Threads webhooks for real-time engagement updates
5. **Media Support**: Add image/video support for richer replies
6. **Analytics**: Track engagement success rates and API usage patterns

## Related Documentation

- [Threads Connect Implementation](./THREADS_CONNECT_IMPLEMENTATION.md)
- [Threads Graph API Docs](https://developers.facebook.com/docs/threads)
- [Adding New Platforms](./ADDING_NEW_PLATFORMS.md)
