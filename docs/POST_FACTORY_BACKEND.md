# Post Factory Backend Integration

## Overview

The Post Factory backend integration uses the `@quill/agent` package to generate multi-platform content from a single outline. This document describes the implementation and usage.

## Architecture

### tRPC Router Structure
```
packages/trpc/server/routers/viewer/postFactory/
├── _router.tsx              # Main router definition
├── generateAll.schema.ts    # Schema for generating all platforms
├── generateAll.handler.ts   # Handler for multi-platform generation
├── expandOutline.schema.ts  # Schema for expanding outlines
├── expandOutline.handler.ts # Handler for outline expansion
├── regenerate.schema.ts     # Schema for regenerating single platform
└── regenerate.handler.ts    # Handler for single platform regeneration
```

### API Endpoint
- **Location**: `/apps/web/pages/api/trpc/postFactory/[trpc].ts`
- **Base URL**: `/api/trpc/postFactory/*`

## Available Endpoints

### 1. Generate All Platforms (`generateAll`)

**Description**: Generates content for multiple platforms from a single outline.

**Input Schema**:
```typescript
{
  outline: string;        // The content outline (required)
  tone: "friendly" | "authoritative" | "contrarian"; // Default: "friendly"
  platforms: ("linkedin" | "x" | "carousel" | "shorts" | "blog")[]; // Min 1 platform
  cta?: string;          // Optional call-to-action
  utm?: string;          // Optional UTM parameters
}
```

**Output**:
```typescript
{
  outputs: Record<string, string>; // Platform -> content mapping
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Example Usage** (Frontend):
```typescript
const generateAllMutation = trpc.postFactory.generateAll.useMutation({
  onSuccess: (data) => {
    console.log(data.outputs); // { linkedin: "...", x: "...", blog: "..." }
  },
});

generateAllMutation.mutate({
  outline: "Hook, 3 key points, example, CTA",
  tone: "authoritative",
  platforms: ["linkedin", "x", "blog"],
  cta: "Learn more",
  utm: "?utm_source=linkedin",
});
```

### 2. Expand Outline (`expandOutline`)

**Description**: Expands a brief idea into a detailed outline.

**Input Schema**:
```typescript
{
  idea: string;          // Brief idea to expand (required)
  tone: "friendly" | "authoritative" | "contrarian"; // Default: "friendly"
}
```

**Output**:
```typescript
{
  outline: string;       // Expanded outline
  tone: string;          // Applied tone
  usage?: UsageStats;
}
```

**Example Usage**:
```typescript
const expandMutation = trpc.postFactory.expandOutline.useMutation();

expandMutation.mutate({
  idea: "Pricing strategies for SaaS startups",
  tone: "authoritative",
});
```

### 3. Regenerate Single Platform (`regenerate`)

**Description**: Regenerates content for a specific platform.

**Input Schema**:
```typescript
{
  outline: string;       // The content outline (required)
  platform: "linkedin" | "x" | "carousel" | "shorts" | "blog";
  cta?: string;          // Optional call-to-action
  utm?: string;          // Optional UTM parameters
}
```

**Output**:
```typescript
{
  content: string;       // Regenerated content
  platform: string;      // Platform name
  usage?: UsageStats;
}
```

**Example Usage**:
```typescript
const regenerateMutation = trpc.postFactory.regenerate.useMutation();

regenerateMutation.mutate({
  outline: "Hook, 3 key points, example, CTA",
  platform: "linkedin",
  cta: "Join our newsletter",
});
```

## Platform-Specific Guidelines

The agent automatically applies these guidelines when generating content:

### LinkedIn
- Professional tone
- 1300-2000 characters
- Use line breaks for readability
- Include 3-5 relevant hashtags
- Engage with questions or insights

### X/Twitter
- Concise and punchy
- 280 characters max per tweet
- Use 1-3 hashtags
- Thread format if needed (numbered tweets)

### Carousel (Instagram)
- 5-10 slides
- Clear headline per slide
- 2-3 bullet points per slide
- Visual-first approach
- Summary slide at the end

### Shorts/Reels
- Script format
- Hook, main points (3-5 quick tips), strong CTA
- 30-60 seconds when spoken
- Include visual cues

### Blog
- Long-form content: 800-1500 words
- Clear introduction
- 3-5 main sections with subheadings
- Conclusion with key takeaways
- SEO-friendly structure

## Integration with @quill/agent Package

The post factory uses the `@quill/agent` package's content tools:

```typescript
import { createQuillAgent, contentTools } from "@quill/agent";

const agent = createQuillAgent({ prisma }, contentTools());

const result = await agent.run({
  task: "Generate posts for LinkedIn and X",
  inputs: {
    outline: "...",
    channels: ["linkedin", "x"],
    cta: "Learn more",
  },
  meta: {
    userId: user.id,
    requestType: "generate_all_posts",
  },
});
```

## Frontend Integration

### Complete Example

```typescript
import { trpc } from "@quillsocial/trpc/react";

function PostFactoryPage() {
  const [outline, setOutline] = useState("");
  const [tone, setTone] = useState<"friendly" | "authoritative" | "contrarian">("friendly");
  const [selectedPlatforms, setSelectedPlatforms] = useState<("linkedin" | "x")[]>(["linkedin"]);
  const [outputs, setOutputs] = useState({});

  const generateAllMutation = trpc.postFactory.generateAll.useMutation({
    onSuccess: (data) => {
      setOutputs(data.outputs);
      showToast("Content generated successfully!", "success");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
    },
  });

  const handleGenerate = () => {
    generateAllMutation.mutate({
      outline,
      tone,
      platforms: selectedPlatforms,
    });
  };

  return (
    <div>
      <textarea value={outline} onChange={(e) => setOutline(e.target.value)} />
      <button 
        onClick={handleGenerate}
        disabled={generateAllMutation.isLoading}
      >
        {generateAllMutation.isLoading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
```

## Error Handling

All endpoints include comprehensive error handling:

```typescript
try {
  const result = await generateAllMutation.mutateAsync({...});
} catch (error) {
  if (error instanceof TRPCError) {
    // Handle tRPC-specific errors
    console.error(error.code, error.message);
  }
}
```

## Usage Tracking

All operations are automatically tracked in the `OpenAIUsage` table via the agent package:

- **userId**: Authenticated user ID
- **requestType**: Operation type (e.g., "generate_all_posts")
- **model**: AI model used (default: "gpt-4o-mini")
- **tokens**: Prompt, completion, and total token counts

## Testing

### Manual Testing via tRPC Playground

You can test endpoints directly using the tRPC devtools or by making HTTP requests:

```bash
curl -X POST http://localhost:3000/api/trpc/postFactory/generateAll \
  -H "Content-Type: application/json" \
  -d '{
    "outline": "Test outline",
    "tone": "friendly",
    "platforms": ["linkedin"]
  }'
```

## Performance Considerations

1. **Token Limits**: Be mindful of outline length and number of platforms
2. **Concurrent Requests**: The agent processes platforms sequentially within a single request
3. **Caching**: Consider implementing caching for frequently requested content
4. **Rate Limiting**: OpenAI API rate limits apply

## Future Enhancements

- [ ] Add support for custom platform guidelines
- [ ] Implement content templates
- [ ] Add A/B testing variants
- [ ] Support for image generation
- [ ] Batch processing for multiple outlines
- [ ] Draft saving and versioning
- [ ] Analytics on generated content performance

## Troubleshooting

### Types Not Available

If you see TypeScript errors about missing `postFactory` property, regenerate tRPC types:

```bash
cd /Users/hadoan/Documents/GitHub/QuillSocial
yarn build
```

### Agent Package Not Found

Ensure the agent package is properly linked:

```bash
cd packages/agent
yarn build
```

### OpenAI API Errors

Check that:
1. `OPENAI_API_KEY` is set in environment variables
2. User has sufficient OpenAI credits
3. Request doesn't exceed token limits

## Related Documentation

- [Agent Package Implementation](../../packages/agent/IMPLEMENTATION.md)
- [Agent Package README](../../packages/agent/readme.md)
- [Post Factory Page](../../apps/web/pages/post-factory.tsx)
