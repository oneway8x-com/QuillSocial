# Onboarding Backend Implementation

## Overview

The onboarding backend consists of three API endpoints that handle the 3-step onboarding flow:
1. Apply Plan - Save user's plan configuration
2. Schedule Post - Create a scheduled post
3. Track Replies - Record engagement activity

## API Endpoints

### 1. `/api/onboarding/apply-plan`

**Purpose**: Saves the user's onboarding plan to the database

**Method**: `POST`

**Request Body**:
```typescript
{
  pillars_count: number;
  slots_count: number;
  pillars: Array<{ name: string; description: string }>;
  purpose: string;
  tone: "friendly" | "authoritative" | "contrarian";
  audienceStage: "starting" | "small" | "growing";
}
```

**Response**:
```typescript
{
  ok: boolean;
  placeholders_created: number;
}
```

**Database Operations**:
- Updates `User.metadata` with onboarding plan data
- Stores: purpose, tone, audienceStage, pillarsCount, slotsCount, pillars, appliedAt timestamp

**Analytics**: Captures `onb_plan_applied` event with PostHog

---

### 2. `/api/onboarding/schedule`

**Purpose**: Creates a scheduled post for the selected platform

**Method**: `POST`

**Request Body**:
```typescript
{
  channel: "linkedin" | "x" | "instagram" | "youtube" | "blog";
  whenISO: string; // ISO date string
  content?: string;
  idea?: string;
}
```

**Response**:
```typescript
{
  ok: boolean;
  draftId: string; // Format: "post_{id}"
  postId: number;
}
```

**Database Operations**:
- Maps channel to appId (linkedin → linkedinsocial, x → xsocial, etc.)
- Finds user's credential for the selected platform
- Creates a `Post` record with:
  - `status: SCHEDULED`
  - `schedulePostDate: whenISO`
  - `tone: FRIENDLY`
  - `content` and `idea` from request

**Analytics**: Captures `onb_post_scheduled` event with channel, whenISO, and postId

---

### 3. `/api/onboarding/reply`

**Purpose**: Tracks engagement replies sent during onboarding

**Method**: `POST`

**Request Body**:
```typescript
{
  platform: string;
  cardId: string;
  replyContent?: string;
}
```

**Response**:
```typescript
{
  ok: boolean;
  totalReplies: number;
}
```

**Database Operations**:
- Reads current `User.metadata.onboardingReplies` array
- Appends new reply with: platform, cardId, content, sentAt timestamp
- Updates user metadata with complete reply history

**Analytics**: Captures `onb_reply_sent` event with platform, cardId, and totalReplies count

---

## Frontend Integration

### Step 1: Apply Plan

The frontend calls `/api/onboarding/apply-plan` with the complete plan data:

```typescript
const resp = await fetch("/api/onboarding/apply-plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pillars_count: plan.pillars.length,
    slots_count: plan.cadence.length,
    pillars: plan.pillars,
    purpose,
    tone,
    audienceStage,
  }),
});
```

### Step 2: Schedule Post

The frontend schedules a post for tomorrow at 9:00 AM:

```typescript
const when = getTomorrowAtNine();
const resp = await fetch("/api/onboarding/schedule", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    channel: activeChannel, 
    whenISO: when.toISOString(),
    content: `My first post from QuillSocial onboarding! 🎉...`,
    idea: "First onboarding post"
  }),
});
```

### Step 3: Send Replies

The frontend tracks each reply:

```typescript
await fetch("/api/onboarding/reply", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    platform, 
    cardId,
    replyContent: `Great insight! Thanks for sharing.`
  }),
});
```

---

## Data Storage

### User Metadata Structure

The onboarding data is stored in `User.metadata` as JSON:

```typescript
{
  onboardingPlan: {
    purpose: string;
    tone: "friendly" | "authoritative" | "contrarian";
    audienceStage: "starting" | "small" | "growing";
    pillarsCount: number;
    slotsCount: number;
    pillars: Array<{ name: string; description: string }>;
    appliedAt: string; // ISO timestamp
  },
  onboardingReplies: Array<{
    platform: string;
    cardId: string;
    content: string;
    sentAt: string; // ISO timestamp
  }>
}
```

### Post Record

Scheduled posts are stored in the `Post` table:

```typescript
{
  id: number;
  userId: number;
  credentialId: number | null;
  appId: string | null; // "linkedinsocial", "xsocial", etc.
  idea: string;
  content: string;
  status: "SCHEDULED";
  schedulePostDate: Date;
  tone: "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN";
  createdDate: Date;
}
```

---

## Error Handling

All endpoints include:
- Authentication check (returns 401 if no session)
- Try-catch error handling
- Console logging for debugging
- Appropriate error responses (500 for server errors)

Example:
```typescript
if (!userId) {
  return res.status(401).json({ error: "Unauthorized" });
}

try {
  // ... database operations
} catch (error) {
  console.error("Error description:", error);
  res.status(500).json({ error: "Failed to perform action" });
}
```

---

## Analytics Integration

All endpoints use PostHog for analytics tracking:

```typescript
import { captureServer } from "@quillsocial/lib/posthog";

await captureServer(userId, "event_name", {
  property1: value1,
  property2: value2,
});
```

**Events tracked**:
- `onb_plan_applied` - When user applies their plan
- `onb_post_scheduled` - When user schedules their first post
- `onb_reply_sent` - When user sends a reply (includes totalReplies count)

---

## Security

- All endpoints require authentication via `getServerSession()`
- User ID is validated before any database operations
- Data is scoped to the authenticated user
- No sensitive data exposed in error messages

---

## Future Enhancements

Potential improvements:
1. **Pillar Creation**: Actually create `Pillar` records in the database
2. **Content Cadence**: Generate placeholder posts based on cadence slots
3. **Reply Tracking**: Link replies to actual social platform interactions
4. **Undo Operations**: Implement delete endpoints for scheduled posts
5. **Validation**: Add Zod schema validation for request bodies
6. **Rate Limiting**: Add rate limiting to prevent abuse
7. **Webhooks**: Notify external systems when onboarding completes

---

## Testing

To test the backend:

1. **Start the dev server**: `yarn dev`
2. **Complete onboarding flow** at `/onboarding`
3. **Check database**: Use Prisma Studio (`yarn db-studio`) to verify:
   - User metadata contains onboarding plan
   - Post table has scheduled post
   - User metadata contains reply history
4. **Check PostHog**: Verify events are being captured

---

## Files Modified

1. `/apps/web/pages/api/onboarding/apply-plan.ts` - Database integration for plan
2. `/apps/web/pages/api/onboarding/schedule.ts` - Post creation logic
3. `/apps/web/pages/api/onboarding/reply.ts` - Reply tracking
4. `/apps/web/pages/onboarding.tsx` - Frontend updates to pass complete data
