# App Registry Pattern - Adding New Social Platforms

This guide explains how to add new social media platforms to QuillSocial using the registry pattern.

## Overview

The registry pattern centralizes platform integrations, making it easy to add new platforms without modifying cron job code. All platform-specific logic is registered in one place.

## Registry Files

### 1. Post Registry (`packages/app-store/postRegistry.ts`)
Handles scheduled post publishing for all platforms.

### 2. Comment Registry (`packages/app-store/commentRegistry.ts`)
Handles comment/reply functionality for platforms that support it.

## Adding a New Platform

### Step 1: Create Platform Directory

Follow the existing structure in `packages/app-store/`:

```
packages/app-store/
└── yourplatform-social/
    ├── _metadata.ts
    ├── api/
    │   ├── add.ts
    │   └── callback.ts
    ├── lib/
    │   ├── index.ts
    │   ├── yourplatformManager.ts
    │   └── yourplatformCredentialSchema.ts
    ├── package.json
    └── static/
        └── icon.svg
```

### Step 2: Implement Manager with Post Function

In `lib/yourplatformManager.ts`:

```typescript
import prisma from "@quillsocial/prisma";

/**
 * Post to YourPlatform
 * @param postId - The post ID from database
 * @returns Result object with post details
 */
export const post = async (postId: number) => {
  const postData = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      credential: true,
      user: true
    }
  });

  if (!postData) {
    throw new Error(`Post ${postId} not found`);
  }

  // Your platform-specific posting logic here
  const platformClient = await getYourPlatformClient(postData.credential);
  const result = await platformClient.createPost({
    text: postData.content,
    // ... other platform-specific fields
  });

  // Update post in database
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "POSTED",
      postedDate: new Date(),
      result: result as any
    }
  });

  return result;
};
```

### Step 3: Export from Index

In `lib/index.ts`:

```typescript
export * as YourPlatformManager from "./yourplatformManager";
export { post } from "./yourplatformManager";
```

### Step 4: Register in Post Registry

In `packages/app-store/postRegistry.ts`:

```typescript
// 1. Add import
import { YourPlatformManager } from "@quillsocial/app-store/yourplatform-social/lib";

// 2. Add to registry
export const POST_HANDLERS: Record<string, PostHandler> = {
  "linkedin-social": LinkedinManager.post,
  "xconsumerkeys-social": xPost,
  "facebook-social": FacebookManager.post,
  "instagram-social": InstagramManager.post,
  "threads-social": ThreadsManager.post,
  "yourplatform-social": YourPlatformManager.post, // Add this line
};
```

**That's it!** Your platform now works with the Post cron automatically. ✅

### Step 5: (Optional) Add Comment/Reply Support

If your platform supports comments/replies, implement the reply function:

In `lib/yourplatformManager.ts`:

```typescript
/**
 * Reply to a post on YourPlatform
 * @param credentialId - The credential to use
 * @param parentId - The parent post ID
 * @param content - The reply content
 * @returns Result with success status
 */
export const replyToPost = async (
  credentialId: number,
  parentId: string,
  content: string
): Promise<{ success: boolean; [key: string]: any }> => {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId }
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  const client = await getYourPlatformClient(credential);
  const result = await client.createReply({
    parentId,
    text: content
  });

  return {
    success: true,
    ...result
  };
};
```

Export it:

```typescript
export { replyToPost } from "./yourplatformManager";
```

Register in `packages/app-store/commentRegistry.ts`:

```typescript
// 1. Add import
import { replyToPost as yourPlatformReply } from "@quillsocial/app-store/yourplatform-social/lib";

// 2. Add to registry
export const COMMENT_HANDLERS: Record<string, CommentHandler> = {
  "xconsumerkeys-social": replyToTweet,
  "yourplatform-social": yourPlatformReply, // Add this line
};

// 3. Remove from unsupported list if it was there
export const PLATFORMS_WITHOUT_COMMENT_SUPPORT = [
  "linkedin-social",
  "facebook-social", 
  "instagram-social",
  // "yourplatform-social", // Remove if it was here
] as const;
```

**Done!** Your platform now works with the CommentPlug cron too. ✅

## Registry Benefits

### 1. **No Cron Code Changes**
- Cron jobs automatically discover new platforms
- No switch statements to update
- No conditional logic to maintain

### 2. **Type Safety**
- TypeScript ensures function signatures match
- Compile-time errors if signature is wrong
- Auto-completion in IDE

### 3. **Easy Testing**
- Test platform integration independently
- Mock registry in tests
- Verify handler registration

### 4. **Discoverable**
- `getSupportedPostApps()` - List all platforms
- `hasPostHandler(appId)` - Check if supported
- Clear separation of concerns

### 5. **Self-Documenting**
- Registry acts as single source of truth
- Easy to see what platforms are supported
- Comments explain platform-specific behavior

## Registry API

### Post Registry

```typescript
// Check if platform supports posting
hasPostHandler("yourplatform-social"); // boolean

// Get post handler function
const handler = getPostHandler("yourplatform-social"); // PostHandler | undefined

// Execute post directly
await executePost("yourplatform-social", postId);

// Get all supported platforms
const platforms = getSupportedPostApps(); // string[]
```

### Comment Registry

```typescript
// Check if platform supports comments
hasCommentHandler("yourplatform-social"); // boolean

// Get comment handler function
const handler = getCommentHandler("yourplatform-social"); // CommentHandler | undefined

// Execute comment directly
await executeComment("yourplatform-social", credentialId, parentId, content);

// Get all supported platforms
const platforms = getSupportedCommentApps(); // string[]
```

## Example: Adding TikTok

Here's a complete example of adding TikTok support:

**1. Create manager function:**

```typescript
// packages/app-store/tiktocsocial/lib/tiktokManager.ts
export const post = async (postId: number) => {
  // ... implementation
};
```

**2. Export from index:**

```typescript
// packages/app-store/tiktocsocial/lib/index.ts
export * as TikTokManager from "./tiktokManager";
```

**3. Register:**

```typescript
// packages/app-store/postRegistry.ts
import { TikTokManager } from "@quillsocial/app-store/tiktocsocial/lib";

export const POST_HANDLERS: Record<string, PostHandler> = {
  // ... existing handlers
  "tiktok-social": TikTokManager.post,
};
```

**4. Deploy and test:**

```bash
# No cron code changes needed!
yarn build
curl -X POST 'http://localhost:3000/api/cron/Post?apiKey=YOUR_KEY'
```

## Migration from Switch Statements

**Before (switch statement):**
```typescript
switch (appId) {
  case "linkedin-social":
    result = await LinkedinManager.post(p.id);
    break;
  case "xconsumerkeys-social":
    result = await post(p.id);
    break;
  // Adding new platform requires modifying this file
  case "newplatform-social":
    result = await NewPlatformManager.post(p.id);
    break;
}
```

**After (registry pattern):**
```typescript
// Cron code stays the same forever
const result = await executePost(appId, p.id);

// Just register new platforms in postRegistry.ts
POST_HANDLERS["newplatform-social"] = NewPlatformManager.post;
```

## Best Practices

1. **Keep handlers simple** - One responsibility per function
2. **Consistent return types** - All handlers return similar structures
3. **Error handling** - Let errors bubble up, cron handles them
4. **Database updates** - Update post status in handler, not cron
5. **Logging** - Log platform-specific details in handler
6. **Documentation** - Document platform-specific quirks in handler

## Troubleshooting

**Handler not found:**
```typescript
Error: Unsupported app: newplatform-social. Supported apps: linkedin-social, ...
```
→ Check registry, ensure handler is registered

**Type mismatch:**
```typescript
Type 'X' is not assignable to type 'PostHandler'
```
→ Check function signature matches `(postId: number) => Promise<any>`

**Platform works locally but not in cron:**
- Verify app slug matches exactly (check `_metadata.ts`)
- Check database has correct `appId` in credentials
- Test with `hasPostHandler(appId)` first

## Future Enhancements

- Dynamic registry loading (runtime registration)
- Plugin system for third-party integrations
- Registry versioning for breaking changes
- Performance metrics per platform
- Automatic retry strategies per platform
- Rate limiting per platform in registry

## See Also

- [CRON_JOBS.md](./CRON_JOBS.md) - Cron job documentation
- [App Store README](./packages/app-store/README.md) - App structure guide
- Platform-specific docs in each app's directory
