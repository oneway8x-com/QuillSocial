# Agent JSON Format Update - One-Shot Prompting

## Summary

Updated the `@quill/agent` package to return structured JSON responses using **one-shot prompting** for better AI understanding, with special handling for X/Twitter threads.

## Key Improvements

1. **One-Shot Prompting**: Added concrete example in system prompt showing expected input/output format
2. **Structured JSON Output**: Returns typed objects instead of plain text
3. **X/Twitter Thread Support**: Native array format for tweet threads
4. **JSON Mode**: Enforced JSON responses via OpenAI's JSON mode

## Changes Made

### 1. Agent Package (`packages/agent/`)

#### `src/tools.content.ts`

- **One-shot prompting**: Added concrete example showing input → output transformation
- **Changed output type**: `GeneratePostsOutput` now returns `posts: Record<string, string | string[]>` instead of `drafts: string`
- **X/Twitter thread support**: X platform now returns an array of strings (thread format) where each tweet is ≤280 characters
- **JSON mode enabled**: Added `responseFormat: "json_object"` to OpenAI call to enforce JSON responses
- **Improved prompts**: System prompt includes example with real content showing LinkedIn as string and X as array

**Example in Prompt:**
```
Input: "Client reduced churn 18% by fixing handoff emails"
Output: {
  "linkedin": "🎯 Client Success Story...",
  "x": ["1/3 🎯 Our client reduced...", "2/3 The winning formula...", "3/3 The lesson..."]
}
```

**Output Format:**
```typescript
{
  posts: {
    "linkedin": "LinkedIn post content...",
    "x": ["Tweet 1/3: ...", "Tweet 2/3: ...", "Tweet 3/3: ..."],
    "carousel": "Carousel content...",
    "shorts": "Shorts script...",
    "blog": "Blog post content..."
  }
}
```

#### `src/openai.ts`
- **Added `responseFormat` option**: New optional parameter in `OpenAIOptions` type
- **OpenAI API integration**: Passes `response_format: { type: "json_object" }` when requested

### 2. tRPC Handlers (`packages/trpc/server/routers/viewer/postFactory/`)

#### `generateAll.handler.ts`
- **Updated parsing**: Now extracts `posts` object instead of parsing `drafts` text
- **Type safety**: Changed return type to `Record<string, string | string[]>` to support X threads
- **Removed regex parsing**: No longer needs to parse plain text with regex patterns

#### `regenerate.handler.ts`
- **Updated parsing**: Now extracts individual platform content from `posts` object
- **Type safety**: Handles both string and string[] types for platform content
- **Fallback handling**: Provides appropriate fallback for X (array) vs other platforms (string)

### 3. Documentation

#### `packages/agent/readme.md`
- Added section documenting the new JSON output format
- Includes example showing X as an array of tweets
- Clarifies that X returns threads while other platforms return single strings

## Benefits

1. **One-Shot Learning**: AI sees concrete example of expected format, reducing errors and hallucinations
2. **Structured Output**: Eliminates need for regex parsing of plain text
3. **Type Safety**: Clear TypeScript types for all platform outputs
4. **Thread Support**: Native support for X/Twitter threads as arrays
5. **Reliability**: JSON mode ensures consistent, parseable responses
6. **Better Quality**: Example shows proper formatting (emojis, line breaks, hashtags, thread numbering)
7. **Maintainability**: Easier to extend with new platforms or formats

### Why One-Shot Prompting?

One-shot prompting provides a concrete example that:
- Shows the AI exactly what "good" output looks like
- Demonstrates proper JSON structure with real content
- Illustrates X as array vs other platforms as strings
- Includes proper formatting (emojis, numbering, hashtags)
- Reduces ambiguity and improves consistency across generations

## Migration Guide

### Before (Plain Text):
```typescript
const result = await agent.run({...});
const draftsText = result.output.drafts; // Plain text string
// Had to parse with regex to extract platform-specific content
```

### After (Structured JSON):
```typescript
const result = await agent.run({...});
const posts = result.output.posts;
const linkedinPost = posts.linkedin; // string
const xThread = posts.x; // string[] - array of tweets
```

## X/Twitter Thread Format

- Always returns an array, even for single tweets
- Each tweet is numbered (e.g., "1/3", "2/3", "3/3")
- Each tweet is ≤280 characters
- Tweets are designed to work standalone while contributing to the thread narrative

## Testing

Build verified successful:
```bash
cd packages/agent
yarn build
# ✅ Build completed without errors
```

## Breaking Changes

⚠️ **This is a breaking change** if any code directly accesses `result.output.drafts`. Update to use `result.output.posts[platform]` instead.

The tRPC handlers have been updated to maintain backward compatibility with existing frontend code by transforming the new format appropriately.
