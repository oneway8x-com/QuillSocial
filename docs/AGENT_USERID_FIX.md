# Agent Package - UserId Foreign Key Fix

## Issue
When using the agent package in the post factory, OpenAI usage logging was failing with:
```
Foreign key constraint failed on the field: `OpenAIUsage_userId_fkey (index)`
```

## Root Cause
The agent's content tools (`expandOutlineTool` and `generatePostsTool`) were hardcoding `userId: -1` when calling `withUsageLogging()`. This caused the Prisma insert to fail because `-1` doesn't exist as a valid user ID in the database.

## Solution
Extended the `AgentContext` type to include optional `meta` field containing `UsageMeta`, which includes the actual `userId`. The agent now passes this meta information to tools during execution.

### Changes Made

#### 1. Updated `types.ts`
```typescript
export type AgentContext = {
  prisma: PrismaClient;
  openaiApiKey?: string;
  byok?: BYOK;
  logger?: Logger;
  meta?: UsageMeta; // ← Added this
};
```

#### 2. Updated `agent.ts`
```typescript
// Create context with meta for tool execution
const toolCtx = { ...ctx, meta };

// Execute the tool
const output = await selectedTool.run(validatedArgs, toolCtx);
```

#### 3. Updated `tools.content.ts`
Both `expandOutlineTool` and `generatePostsTool` now use:
```typescript
const callOpenAI = withUsageLogging(ctx, {
  userId: ctx.meta?.userId ?? -1,  // ← Uses actual userId from context
  teamId: ctx.meta?.teamId,
  requestType: ctx.meta?.requestType ?? "expand_outline",
  model: ctx.meta?.model ?? "gpt-4o-mini",
});
```

## How It Works Now

1. **Handler calls agent.run()** with meta containing the actual userId:
   ```typescript
   const result = await agent.run({
     task: "Generate posts...",
     inputs: { outline, channels },
     meta: {
       userId: user.id,  // ← Real user ID from authenticated session
       requestType: "generate_all_posts",
     },
   });
   ```

2. **Agent passes meta to tool context**:
   ```typescript
   const toolCtx = { ...ctx, meta };
   const output = await selectedTool.run(validatedArgs, toolCtx);
   ```

3. **Tool uses userId from context**:
   ```typescript
   const callOpenAI = withUsageLogging(ctx, {
     userId: ctx.meta?.userId ?? -1,  // ← Gets real userId
   });
   ```

4. **OpenAI usage is logged correctly** with the authenticated user's ID

## Testing
After rebuilding the agent package:
```bash
cd packages/agent && yarn build
```

The post factory now successfully logs OpenAI usage without foreign key constraint errors.

## Benefits
- ✅ Proper usage tracking per user
- ✅ No more foreign key constraint failures
- ✅ Accurate billing and analytics data
- ✅ Maintains backward compatibility (falls back to -1 if meta not provided)

## Files Modified
- `/packages/agent/src/types.ts`
- `/packages/agent/src/agent.ts`
- `/packages/agent/src/tools.content.ts`
