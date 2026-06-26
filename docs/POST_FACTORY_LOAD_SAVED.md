# Post Factory - Load Saved Posts Feature

## Overview
The Post Factory now automatically loads previously generated content from the database when navigating to the page, allowing users to continue editing their posts without losing work.

## Implementation Details

### 1. Backend - New Query Endpoint

Created `getPost` query in the postFactory router:

**Location:** `/packages/trpc/server/routers/viewer/postFactory/`

**Files:**
- `getPost.schema.ts` - Input validation
- `getPost.handler.ts` - Query logic
- `_router.tsx` - Route registration

**Query Logic:**
```typescript
trpc.viewer.postFactory.getPost.useQuery({ ideaId })
```

The handler follows this priority:
1. If `postId` provided → Fetch specific post by ID
2. If `ideaId` provided → Fetch most recent post for that idea
3. If neither → Fetch most recent post from post factory

**Filtering:**
- Only returns posts created from Post Factory (`multiPlatformOutputs` is not null)
- Only returns posts belonging to the authenticated user
- Orders by `createdDate DESC` to get the most recent

### 2. Frontend - Auto-Load on Page Visit

**Updated:** `/apps/web/pages/post-factory.tsx`

**New Query:**
```typescript
const { data: existingPost } = trpc.viewer.postFactory.getPost.useQuery(
  { ideaId: typeof ideaId === "string" ? ideaId : undefined },
  { enabled: !!ideaId }
);
```

**Loading Priority in useEffect:**
1. **Existing Post** (highest priority) - If saved post exists
   - Loads outline, tone, outputs, CTA, UTM
   - Parses X thread items
   - Shows: "Loaded saved post from database"

2. **Outline from Idea** - If no saved post but outline exists
   - Loads outline text and tone
   - Shows: "Loaded outline from idea"

3. **Idea Title** - If no outline
   - Uses idea title as starting point
   - Shows: "Loaded idea. You can expand it to an outline first."

4. **Reset Form** - If no ideaId
   - Clears all fields
   - Resets to defaults

### 3. Data Structure

**Post Table Fields Used:**
```typescript
{
  postId: number,
  outline: string,              // From post.idea
  tone: "friendly" | "authoritative" | "contrarian" | null,
  outputs: {                    // From post.multiPlatformOutputs JSON
    linkedin: string,
    x: string,
    carousel: string,
    shorts: string,
    blog: string
  } | null,
  cta: string | null,
  utm: string | null,
  ideaId: string | null,
  status: PostStatus,
  createdAt: Date
}
```

## User Flow

### Scenario 1: First Time Creating Post for an Idea
1. User navigates to Post Factory with `?ideaId=xyz`
2. System checks for existing posts → None found
3. Loads outline from Idea (if available)
4. User generates content → Saved to database
5. Next visit: Content loads automatically ✨

### Scenario 2: Editing Existing Post
1. User navigates to Post Factory with `?ideaId=xyz`
2. System finds existing post in database
3. **All fields auto-populate:**
   - Outline (input section)
   - Tone selection
   - Platform outputs (all tabs)
   - X thread items (parsed)
   - CTA and UTM fields
4. User can continue editing from where they left off

### Scenario 3: Creating New Post (No Idea)
1. User navigates to Post Factory without ideaId
2. Form resets to defaults
3. Clean slate for new content creation

## Benefits

### 1. **Seamless Editing Experience**
- No data loss when navigating away
- Can iterate on content over multiple sessions
- All platforms' content preserved

### 2. **Efficient Workflow**
```
Idea → Generate → Save → Leave → Return → Continue Editing
```

### 3. **Smart Loading**
- Only loads relevant posts (from Post Factory, not legacy posts)
- Most recent post takes priority
- User-specific (no mixing of users' data)

### 4. **Version History Ready**
- All posts saved with timestamps
- Can extend to show history of generations
- Easy to implement "Load Previous Version" feature

## Technical Notes

### Database Query
Uses Prisma's JSON filtering:
```typescript
multiPlatformOutputs: {
  not: Prisma.JsonNull, // Only posts with multi-platform outputs
}
```

### X Thread Parsing
Automatically parses saved X content into editable thread items:
```typescript
if (existingPost.outputs.x) {
  const threadItems = parseXThread(existingPost.outputs.x);
  setXThreadItems(threadItems);
}
```

### Toast Notifications
Clear feedback on what was loaded:
- ✅ "Loaded saved post from database"
- ℹ️ "Loaded outline from idea"
- ℹ️ "Loaded idea. You can expand it to an outline first."

## Future Enhancements

### 1. Version History UI
Show list of all previous generations:
```
[Latest] Oct 15, 2025 2:30 PM
[v2]     Oct 14, 2025 4:15 PM
[v1]     Oct 13, 2025 9:00 AM
```

### 2. Auto-Save Draft
Save as user types (debounced):
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    saveDraft({ outline, tone, outputs, cta, utm });
  }, 2000);
  return () => clearTimeout(timer);
}, [outline, tone, outputs, cta, utm]);
```

### 3. Compare Versions
Side-by-side comparison of different generations

### 4. Restore Previous Version
One-click restore to earlier version

### 5. Export History
Download all versions for an idea

## API Reference

### Query: `getPost`

**Input:**
```typescript
{
  ideaId?: string,  // Optional: Get posts for specific idea
  postId?: number   // Optional: Get specific post by ID
}
```

**Output:**
```typescript
{
  postId: number,
  outline: string,
  tone: "friendly" | "authoritative" | "contrarian" | null,
  outputs: Record<string, string> | null,
  cta: string | null,
  utm: string | null,
  ideaId: string | null,
  status: PostStatus,
  createdAt: Date
} | null
```

**Usage:**
```typescript
// Load by ideaId
const { data } = trpc.viewer.postFactory.getPost.useQuery({ ideaId: "xyz" });

// Load by postId
const { data } = trpc.viewer.postFactory.getPost.useQuery({ postId: 123 });

// Load most recent (no params)
const { data } = trpc.viewer.postFactory.getPost.useQuery({});
```

## Testing Checklist

- [x] Load existing post by ideaId
- [x] Load outline when no post exists
- [x] Reset form when no ideaId
- [x] Parse X thread items correctly
- [x] Show appropriate toast messages
- [x] Only load user's own posts
- [x] Handle null/undefined gracefully
- [x] Multi-platform outputs populate correctly

## Related Documentation

- [POST_FACTORY_DATABASE_DECISION.md](./POST_FACTORY_DATABASE_DECISION.md) - Why we use Post table
- [POST_FACTORY_BACKEND.md](./POST_FACTORY_BACKEND.md) - Backend architecture
- [X_THREAD_UI_ENHANCEMENT.md](./X_THREAD_UI_ENHANCEMENT.md) - X thread formatting
