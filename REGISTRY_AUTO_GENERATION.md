# Registry Auto-Generation

## Overview

The `postRegistry.ts` and `commentRegistry.ts` files are now **automatically generated** by the app-store build CLI. This ensures that:

1. New platform integrations are automatically detected and added to registries
2. No manual updates to registry files are needed when adding platforms
3. The registries always stay in sync with available platform handlers

## Generated Files

The build system now generates two additional files:

- `packages/app-store/postRegistry.generated.ts` - Auto-generated post handler registry
- `packages/app-store/commentRegistry.generated.ts` - Auto-generated comment handler registry

## How It Works

### Build Command

```bash
yarn app-store:build
```

This command:
1. Scans all platform directories in `packages/app-store/`
2. Detects exported `post` functions for the post registry
3. Detects exported reply/comment functions (`replyToTweet`, `reply`, `comment`, etc.) for the comment registry
4. Generates TypeScript registry files with proper imports and type safety
5. Formats the output using Prettier with TypeScript parser

### Detection Logic

#### Post Functions
The CLI looks for:
- `export const post = ` or `export async function post()` in Manager files
- Files checked: `{platform}Manager.ts`, `manager.ts`, `index.ts`

#### Comment Functions  
The CLI looks for:
- `replyToTweet`, `reply`, `comment`, `replyToPost`, `addComment` exports
- Files checked: `{platform}Manager.ts`, `manager.ts`, `index.ts`
- Platforms without comment support are tracked in `PLATFORMS_WITHOUT_COMMENT_SUPPORT`

## Adding a New Platform

When adding a new social media platform:

1. **Create your platform directory** (e.g., `packages/app-store/newsocial/`)

2. **Implement post handler** in `lib/newsocialManager.ts`:
```typescript
export const post = async (postId: number) => {
  // Your post logic here
  return { success: true, data: {...} };
};
```

3. **Implement comment handler** (optional) in `lib/newsocialManager.ts`:
```typescript
export const reply = async (
  credentialId: number,
  parentId: string,
  content: string
) => {
  // Your reply logic here
  return { success: true, data: {...} };
};
```

4. **Rebuild the registries**:
```bash
yarn app-store:build
```

5. **Use in cron jobs** - The platform is now automatically available in:
   - `/apps/web/pages/api/cron/Post.ts`
   - `/apps/web/pages/api/cron/CommentPlug.ts`

## Registry Structure

### Post Registry

Generated structure:
```typescript
import { post as platform_post } from "./platform/lib";

export const POST_HANDLERS: Record<string, PostHandler> = {
  "platform-slug": platform_post,
  // ... more platforms
};

export function executePost(appId: string, postId: number) {
  // Lookup and execute handler
}
```

### Comment Registry

Generated structure:
```typescript
import { reply as platform_reply } from "./platform/lib";

export const COMMENT_HANDLERS: Record<string, CommentHandler> = {
  "platform-slug": platform_reply,
  // ... more platforms  
};

export const PLATFORMS_WITHOUT_COMMENT_SUPPORT: readonly string[] = [
  "instagram-social",
  // Platforms that support posts but not comments
];

export function executeComment(...) {
  // Lookup and execute handler
}
```

## Watch Mode

For development, use watch mode to automatically regenerate registries when platform files change:

```bash
yarn app-store:watch
```

## Benefits

✅ **No Manual Maintenance** - Registries update automatically when platforms are added/removed  
✅ **Type Safety** - Generated TypeScript with proper types  
✅ **Consistency** - Single source of truth for platform capabilities  
✅ **Developer Experience** - Just implement the handler functions, build takes care of the rest  
✅ **Documentation** - Auto-generated comments explain each registry's purpose

## Technical Details

### Parser Change

The build system uses the **TypeScript parser** instead of Babel to support TypeScript-specific syntax like `readonly string[]`:

```typescript
// In packages/app-store-cli/src/build.ts
const formatOutput = (source: string) =>
  prettier.format(source, {
    parser: "typescript",  // Changed from "babel"
    ...prettierConfig,
  });
```

### Function Detection

The CLI uses AST parsing to detect exported functions:

```typescript
function checkFunctionExport(appPath: string, fileName: string, functionName: string): boolean {
  // Checks for both:
  // export const functionName = ...
  // export async function functionName() ...
}
```

### Import Generation

Platform imports are generated with unique variable names to avoid collisions:

```typescript
import { post as linkedin_Manager_post } from "./linkedinsocial/lib";
import { post as xconsumerkeys_Manager_post } from "./xconsumerkeyssocial/lib";
```

## Migration from Manual Registries

If you previously had manual `postRegistry.ts` or `commentRegistry.ts` files:

1. Back them up if needed
2. Delete the manual files
3. Run `yarn app-store:build` to generate new ones  
4. The generated `.generated.ts` files will replace them
5. Update imports in cron files to use `.generated.ts` versions

## Troubleshooting

**Registry not updating?**
- Run `yarn app-store:build` to force regeneration
- Check that your handler functions are properly exported
- Verify the function names match expected patterns (post, reply, comment, etc.)

**TypeScript errors after generation?**
- Run `yarn app-store:build` again
- Check for syntax errors in your platform handler files
- Ensure all imports in your platform code are valid

**Platform not detected?**
- Verify your function export matches the expected signature
- Check that the file is in the correct location (`lib/` directory)
- Ensure the app has a proper slug in its configuration
