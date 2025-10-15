# Agent One-Shot Prompting - Complete Platform Support

## What Changed

Updated the `generatePostsTool` in `@quill/agent` to use **comprehensive one-shot prompting** with examples for all platforms (LinkedIn, X/Twitter, Carousel, Shorts/Reels, Blog).

## The One-Shot Example

The system prompt now includes this complete example to teach the AI:

**Input:** "Client reduced churn 18% by fixing handoff emails"

**Output:**
```json
{
  "linkedin": "🎯 Client Success Story\n\nOur client achieved an 18% reduction...",
  "x": [
    "1/3 🎯 Our client reduced customer churn by 18%...",
    "2/3 The winning formula:\n• Personalized transition messages...",
    "3/3 The lesson: Customer churn often starts..."
  ],
  "carousel": [
    "Slide 1: Client Success Story\n\n🎯 18% Churn Reduction...",
    "Slide 2: The Problem\n\n• Poor transition communication...",
    "Slide 3: The Solution\n\n✓ Personalized messages...",
    "Slide 4: The Results\n\n18% reduction in churn...",
    "Slide 5: Key Takeaway\n\nCustomer retention starts..."
  ],
  "shorts": "[HOOK - 0:00-0:05]\n(Text on screen: 18% Churn Reduction)...",
  "blog": "## Client Success Story: How Better Handoff Emails...\n\n### The Challenge..."
}
```

## Why This Matters

### Before (Zero-Shot)
- AI had to guess the format from text instructions alone
- Inconsistent output structure
- Often needed retry logic or post-processing

### After (One-Shot)
- AI sees exactly what good output looks like
- Consistent JSON structure every time
- Proper X thread formatting with numbering
- Better quality content (emojis, formatting, hashtags)

## Key Benefits

1. **Accuracy**: Concrete example reduces misunderstanding
2. **Consistency**: Every response follows the same pattern
3. **Quality**: Example shows best practices (emojis, line breaks, thread numbering)
4. **X Threads**: Clear demonstration that X uses array format
5. **JSON Mode**: Combined with OpenAI's JSON mode for guaranteed valid output

## Technical Details

### Platform Output Formats

| Platform | Format | Markdown | Notes |
|----------|--------|----------|-------|
| **LinkedIn** | `string` | ❌ No | Plain text with emojis, symbols (✓ • →), line breaks |
| **X/Twitter** | `string[]` | ❌ No | Array of tweets, each ≤280 chars, numbered (1/3, 2/3) |
| **Carousel** | `string[]` | ❌ No | Array of 5-10 slides, each with headline + bullets |
| **Shorts/Reels** | `string` | ❌ No | Script format with timestamps and visual cues |
| **Blog** | `string` | ✅ Yes | Full markdown with ##, ###, **, lists, etc. |

### Return Type
```typescript
Record<string, string | string[]>
```

### Array Platforms
- **X/Twitter**: Always returns array (thread format)
- **Carousel**: Always returns array (slide format)
- Others return single string

### Character Limits
- **X tweets**: ≤280 characters each
- **LinkedIn**: 1300-2000 characters recommended
- **Carousel slides**: Headline + 2-3 bullet points per slide
- **Shorts**: 30-60 seconds when spoken
- **Blog**: 800-1500 words

## Files Modified

1. `packages/agent/src/tools.content.ts` - Added one-shot example
2. `packages/agent/src/openai.ts` - Added JSON mode support
3. `packages/trpc/server/routers/viewer/postFactory/generateAll.handler.ts` - Updated parser
4. `packages/trpc/server/routers/viewer/postFactory/regenerate.handler.ts` - Updated parser
5. `packages/agent/readme.md` - Updated documentation

## Build Status

✅ Built successfully with `yarn build`
