# Post Factory Database Integration - Using Existing Post Table

## Decision: Reuse Post Table Instead of Creating GeneratedPost

**Rationale:**
The existing `Post` table already has most of the fields we need for post factory functionality. Creating a separate `GeneratedPost` table would cause unnecessary duplication.

## Changes Made

### 1. Enhanced Post Table Schema
Added new optional fields to support Post Factory:

```prisma
model Post {
  // ... existing fields ...
  
  // Post Factory fields
  ideaId               String?
  ideaRef              Idea?           @relation(fields: [ideaId], references: [id], onDelete: SetNull)
  tone                 OutlineTone?    // FRIENDLY, AUTHORITATIVE, CONTRARIAN
  multiPlatformOutputs Json?           // {linkedin, x, carousel, shorts, blog}
  cta                  String?         @db.Text
  utm                  String?
  
  @@index([ideaId])
}
```

### 2. Updated Idea Model
Added relation to Post:
```prisma
model Idea {
  // ... existing fields ...
  posts     Post[]  // Relation to generated posts
}
```

### 3. Backend Handler Updated
`saveGeneratedPosts.handler.ts` now uses the Post model:

```typescript
const post = await prisma.post.create({
  data: {
    userId: user.id,
    idea: outline,                    // Backward compatible
    content: outputs.linkedin || "",  // Default content
    status: "NEW",
    ideaId,
    tone,
    multiPlatformOutputs: outputs,    // Multi-platform content
    cta,
    utm,
  },
});
```

### 4. Migration Applied
- Migration: `20251015070855_update_post_table_for_post_factory`
- Removed GeneratedPost table
- Added new fields to Post table
- Updated indexes

## Benefits

### 1. **Unified Data Model**
- Single source of truth for all posts (legacy + post factory)
- No need to query multiple tables
- Consistent status tracking (NEW → SCHEDULED → POSTED)

### 2. **Backward Compatibility**
- Existing posts still work (all new fields are optional)
- `idea` field stores outline text for compatibility
- `content` field holds primary platform content

### 3. **Rich Features Available**
- Scheduling via `schedulePostDate`
- Platform targeting via `credentialId` and `appId`
- Image support via `imagesDataURL` and `cloudFiles`
- Comment scheduling via `Plug` relation
- Usage tracking via `usageTokens`

### 4. **Future-Proof**
- Can schedule individual platform posts from `multiPlatformOutputs`
- Can track which platforms were posted
- Can link back to original idea for analytics

## Field Mapping

| Post Factory Concept | Post Table Field |
|---------------------|------------------|
| Outline text | `idea` (String) |
| Generated content | `multiPlatformOutputs` (Json) |
| Primary platform content | `content` (String) |
| Tone | `tone` (OutlineTone?) |
| Call-to-action | `cta` (String?) |
| UTM parameters | `utm` (String?) |
| Source idea | `ideaId` + `ideaRef` relation |
| Post status | `status` (NEW/SCHEDULED/POSTED) |

## Usage Flow

1. **Generate Content** (Post Factory)
   - User inputs outline
   - System generates multi-platform content
   - Saves to Post table with `multiPlatformOutputs`

2. **Schedule Posts**
   - User can schedule from Post Factory
   - Each platform gets its content from `multiPlatformOutputs`
   - Individual posts created with specific `appId`/`credentialId`

3. **Track History**
   - All generated posts linked via `ideaId`
   - Can see evolution from idea → outline → posts
   - Usage tracking maintained

## Migration Notes

- **Safe Migration**: All new fields are optional
- **No Data Loss**: Existing posts unaffected
- **Rollback Safe**: Can remove new fields if needed
- **Index Added**: `ideaId` indexed for performance

## Frontend Integration

The frontend continues to work as before:
- Calls `trpc.viewer.postFactory.saveGeneratedPosts`
- Receives `postId` in response
- Can navigate to `/posts/{postId}` for scheduling

## Related Files Modified

1. `/packages/prisma/schema.prisma`
   - Enhanced Post model
   - Updated Idea model
   - Removed GeneratedPost model

2. `/packages/trpc/server/routers/viewer/postFactory/saveGeneratedPosts.handler.ts`
   - Changed from `prisma.generatedPost.create` to `prisma.post.create`
   - Maps outputs to `multiPlatformOutputs` JSON field

3. `/apps/web/pages/post-factory.tsx`
   - No changes needed (API contract maintained)
   - Returns `postId` which can be used for scheduling

## Future Enhancements

Possible improvements now that we're using Post table:

1. **Scheduling UI**: Direct from Post Factory → Calendar
2. **Post Analytics**: Track performance per platform
3. **A/B Testing**: Compare different versions
4. **Draft Management**: Save drafts before generating
5. **Template Library**: Save successful posts as templates
