using OpenAI # @quill/agent

A lightweight Agent SDK for QuillSocial with OpenAI integration and automatic usage logging.

## Features

- 🤖 **Agent Factory** - Create agents with pluggable tools
- 📊 **Usage Logging** - Automatic OpenAI usage tracking to database
- 🔧 **Tool System** - Extensible tool architecture with Zod validation
- 🔐 **BYOK Support** - Bring Your Own Key for platform-specific operations
- 📝 **Type-Safe** - Full TypeScript support with comprehensive types
- 🧪 **Tested** - 90%+ test coverage

## Installation

```bash
yarn add @quill/agent
# or
npm install @quill/agent
```

### Peer Dependencies

```bash
yarn add openai@^4 @prisma/client@>=5.0.0 zod@^3
```

## Quick Start

```typescript
import { createQuillAgent, contentTools } from "@quill/agent";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create agent with content tools
const agent = createQuillAgent(
  { 
    prisma, 
    openaiApiKey: process.env.OPENAI_API_KEY 
  },
  contentTools()
);

// Run a task
const result = await agent.run({
  task: "Expand this idea into an outline",
  inputs: { 
    idea: "Client reduced churn 18% by fixing handoff emails",
    tone: "authoritative" 
  },
  meta: {
    userId: 123,
    teamId: 45,
    requestType: "expand_outline",
    apiEndpoint: "/api/agent",
  },
});

console.log(result.toolInvoked); // "expandOutline"
console.log(result.output); // { outline: "...", tone: "authoritative" }
console.log(result.usage); // { promptTokens: 12, completionTokens: 34, totalTokens: 46 }
```

## API Reference

### `createQuillAgent(ctx, baseTools?)`

Creates a new agent instance.

**Parameters:**
- `ctx: AgentContext` - Required context with Prisma client
- `baseTools?: Tool[]` - Optional initial tools to register

**Returns:** `QuillAgent` with `run`, `tools`, and `register` methods

### Agent Context

```typescript
type AgentContext = {
  prisma: PrismaClient;           // Required for usage logging
  openaiApiKey?: string;          // Defaults to process.env.OPENAI_API_KEY
  byok?: BYOK;                    // Bring Your Own Key credentials
  logger?: Logger;                // Optional logger interface
};
```

### Usage Metadata

```typescript
type UsageMeta = {
  userId: number;                 // User making the request
  teamId?: number | null;         // Optional team context
  requestType: string;            // 'chat_completion', 'rewrite', etc.
  apiEndpoint?: string;           // API endpoint used
  model?: string;                 // Defaults to 'gpt-4o-mini'
};
```

## Built-in Tools

### Content Tools

```typescript
import { contentTools } from "@quill/agent";

// expandOutlineTool - Expands brief ideas into detailed outlines
// generatePostsTool - Creates platform-specific posts from outlines
```

#### Generate Posts Output

The `generatePostsTool` returns a structured JSON object with each platform as a key:

```typescript
const result = await agent.run({
  task: "Generate posts for LinkedIn and X",
  inputs: {
    outline: "Your content outline here...",
    channels: ["linkedin", "x"],
    cta: "Learn more at example.com",
  },
  meta: {
    userId: 123,
    requestType: "generate_posts",
  },
});

// result.output.posts structure:
// {
//   "linkedin": "LinkedIn post content...",
//   "x": ["Tweet 1/3: First tweet...", "Tweet 2/3: Second tweet...", "Tweet 3/3: Final tweet..."],
//   "carousel": "Carousel slides content...",
//   "shorts": "Shorts/Reels script...",
//   "blog": "Blog post content..."
// }
//
// Note: X/Twitter returns an array of strings (thread format) where each tweet is ≤280 characters
// Other platforms return a single string
```

### Engagement Tools

```typescript
import { engagementTools } from "@quill/agent";

// listTargetsTool - Lists engagement targets
// scoreFeedTool - Scores feed items for engagement priority
```

### Schedule Tools

```typescript
import { scheduleTools } from "@quill/agent";

// schedulePostTool - Schedules posts for future publication
```

### Using All Tools

```typescript
import { allTools } from "@quill/agent";

const agent = createQuillAgent(ctx, allTools());
```

## Custom Tools

Create custom tools with Zod schemas:

```typescript
import { z } from "zod";
import type { Tool } from "@quill/agent";

const myTool: Tool<{ input: string }, { output: string }> = {
  name: "myTool",
  description: "Does something useful",
  schema: z.object({
    input: z.string().min(1),
  }),
  run: async (args, ctx) => {
    // Your logic here
    return { output: `Processed: ${args.input}` };
  },
};

// Register custom tool
agent.register(myTool);
```

## Usage Logging

All OpenAI calls are automatically logged to the `OpenAIUsage` table:

```prisma
model OpenAIUsage {
  id               Int      @id @default(autoincrement())
  userId           Int
  teamId           Int?
  prompt           String   @db.Text
  result           String   @db.Text
  promptTokens     Int
  completionTokens Int
  totalTokens      Int
  requestType      String
  apiEndpoint      String?
  model            String
  createdAt        DateTime @default(now())
}
```

## Direct OpenAI Usage

Use the `withUsageLogging` wrapper for standalone OpenAI calls:

```typescript
import { withUsageLogging } from "@quill/agent";

const callOpenAI = withUsageLogging(ctx, {
  userId: 123,
  requestType: "custom_task",
});

const response = await callOpenAI(
  [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Hello!" },
  ],
  { temperature: 0.7 }
);

console.log(response.text);
console.log(response.usage);
```

## Security

### Redacting Secrets

Use `redactSecrets` to sanitize objects before logging:

```typescript
import { redactSecrets } from "@quill/agent";

const sanitized = redactSecrets({
  name: "John",
  apiKey: "secret123",
  password: "pass456",
});

// { name: "John", apiKey: "[REDACTED]", password: "[REDACTED]" }
```

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Watch mode
yarn dev

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Type check
yarn typecheck

# Lint
yarn lint
```

## Architecture

- **No framework coupling** - Works in any Node.js environment
- **Injected dependencies** - Prisma client passed as context
- **Type-safe** - Full TypeScript support with strict mode
- **Extensible** - Plugin-based tool architecture
- **Observable** - Optional logger interface for debugging

## License

MIT
