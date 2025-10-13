# Template Generator System - Technical Documentation

## Overview

This document describes the refactored post generator system following SOLID principles and design patterns.

## Architecture

### SOLID Principles Implementation

#### 1. Single Responsibility Principle (SRP)
Each generator class has one responsibility: generating a specific type of post.

```typescript
// ✅ Good - Each generator handles one template type
class FeatureLaunchGenerator extends BasePostGenerator {
  // Only handles feature launch posts
}

class SneakPeekGenerator extends BasePostGenerator {
  // Only handles sneak peek posts
}
```

#### 2. Open/Closed Principle (OCP)
The system is open for extension but closed for modification.

```typescript
// ✅ Adding new templates doesn't require modifying existing code
// Just create a new generator class extending BasePostGenerator
class NewTemplateGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    // Custom implementation
  }
}
```

#### 3. Liskov Substitution Principle (LSP)
All generators can be used interchangeably through the `IPostGenerator` interface.

```typescript
// ✅ Any generator can replace another without breaking functionality
const generator: IPostGenerator = new FeatureLaunchGenerator();
const result = await generator.generate(userId, ...args);
```

#### 4. Interface Segregation Principle (ISP)
Generators only implement the methods they need.

```typescript
interface IPostGenerator {
  generate(userId: number, ...args: any[]): Promise<GeneratorResponse>;
}
// ✅ Simple, focused interface - no unnecessary methods
```

#### 5. Dependency Inversion Principle (DIP)
High-level modules depend on abstractions, not concrete implementations.

```typescript
// ✅ API handler depends on IPostGenerator interface, not specific generators
class GeneratorRegistry {
  private generators: Map<number, IPostGenerator> = new Map();
  // Works with any IPostGenerator implementation
}
```

---

## Design Patterns

### 1. Template Method Pattern

The `BasePostGenerator` class uses the Template Method pattern to define the skeleton of the generation algorithm.

```typescript
abstract class BasePostGenerator implements IPostGenerator {
  // Template method - defines the flow
  async generate(userId: number, ...args: any[]): Promise<GeneratorResponse> {
    const format = this.extractFormat(args);
    const instruction = this.buildInstruction(args, format);
    return await this.executeGeneration(userId, instruction);
  }

  // Abstract method - subclasses provide specifics
  protected abstract buildInstruction(args: any[], format?: string): string;
}
```

**Benefits:**
- Common logic is reused
- Subclasses only implement specific parts
- Consistent behavior across all generators

### 2. Registry Pattern

The `GeneratorRegistry` manages all generator instances.

```typescript
class GeneratorRegistry {
  private generators: Map<number, IPostGenerator> = new Map();

  register(templateId: number, generator: IPostGenerator): void {
    this.generators.set(templateId, generator);
  }

  get(templateId: number): IPostGenerator | undefined {
    return this.generators.get(templateId);
  }
}
```

**Benefits:**
- Centralized generator management
- Easy to add/remove generators
- Decouples API handler from specific implementations

### 3. Factory Pattern

Factory functions provide backward compatibility.

```typescript
export const generateFeatureLaunch = async (
  userId: number,
  featureName: string,
  userBenefit: string,
  useCase: string,
  ctaLink: string,
  format?: string
) => {
  const generator = new FeatureLaunchGenerator();
  return await generator.generate(userId, featureName, userBenefit, useCase, ctaLink, format);
};
```

**Benefits:**
- Existing code doesn't break
- Gradual migration path
- Clean API for consumers

---

## File Structure

```
packages/app-store/chatgptai/lib/completions/generators/
├── base-generator.ts              # Base classes and interfaces
├── index.ts                       # Central export point
│
├── generate-feature-launch.ts     # ID 1: Feature Launch
├── generate-sneak-peek.ts         # ID 2: Sneak Peek / Beta
├── generate-problem-solution.ts   # ID 3: Problem → Solution
├── generate-user-feedback.ts      # ID 4: Built from Feedback
├── generate-how-it-works.ts       # ID 5: How It Works
├── generate-before-after.ts       # ID 6: Before & After
├── generate-valuable-tips.ts      # ID 7: Share Valuable Tips
├── generate-founder-voice.ts      # ID 8: Founder Voice
├── generate-struggle.ts           # ID 9: Share Your Struggle
├── generate-small-mighty.ts       # ID 10: Small but Mighty
├── generate-book-learning.ts      # ID 11: Share Book Learnings
├── generate-recent-learning.ts    # ID 12: Share Recent Learning
├── generate-favourite-tool.ts     # ID 13: Share Favorite Tool
├── generate-changelog.ts          # ID 14: Weekly Changelog
├── generate-from-scratch.ts       # ID 15: Start from Scratch
├── generate-from-article.ts       # ID 16: Article to Post
├── generate-format-content.ts     # ID 17: Format Your Content
│
└── refactored/                    # Optional: Refactored versions
    └── generate-feature-launch.ts # Example using base class
```

---

## Generator Mapping

| Template ID | Code | Generator Function | Category |
|------------|------|-------------------|----------|
| 1 | `feature-launch` | `generateFeatureLaunch` | Product Launch |
| 2 | `sneak-peek` | `generateSneakPeek` | Product Launch |
| 3 | `problem-solution` | `generateProblemSolution` | Product Launch |
| 4 | `user-feedback` | `generateUserFeedback` | Product Launch |
| 5 | `how-it-works` | `generateHowItWorks` | Educational |
| 6 | `before-after` | `generateBeforeAfter` | Educational |
| 7 | `valuable-tips` | `generateValuableTips` | Educational |
| 8 | `founder-voice` | `generateFounderVoice` | Story & Narrative |
| 9 | `struggle` | `generateStruggle` | Story & Narrative |
| 10 | `small-mighty` | `generateSmallMighty` | Story & Narrative |
| 11 | `book-learning` | `generateBookLearning` | Engagement |
| 12 | `recent-learning` | `generateRecentLearning` | Engagement |
| 13 | `favourite-tool` | `generateFavouriteTool` | Engagement |
| 14 | `changelog` | `generateChangelog` | Engagement |
| 15 | `from-scratch` | `generateFromScratch` | General |
| 16 | `from-article` | `generateFromArticle` | General |
| 17 | `format-content` | `generateFormatContent` | General |

---

## Adding a New Template

Follow these steps to add a new template generator:

### Step 1: Create Generator File

```typescript
// generate-new-template.ts
import {
  getChatCompletions,
  getRewriteCompletions,
} from "../getChatCompletions";

const getMessageTexts = (
  param1: string,
  param2: string,
  format?: string
) => {
  const instruction = format
    ? `[Your instruction with format]`
    : `[Your instruction without format]`;
  return instruction;
};

export const generateNewTemplate = async (
  userId: number,
  param1: string,
  param2: string,
  format?: string
) => {
  const { chatCompletion: post } = await getRewriteCompletions(
    userId,
    getMessageTexts(param1, param2, format)
  );

  let statusContent: string | undefined = "";
  const tokens: (any | undefined)[] = [];

  if (post && post.choices && post.choices.length > 0) {
    statusContent = post?.choices[0]?.message?.content!;
    tokens.push(post.usage);
  }

  return {
    tokens,
    post: statusContent.replace(/['"]/g, ""),
  };
};
```

### Step 2: Export from Index

```typescript
// index.ts
export { generateNewTemplate } from "./generate-new-template";
```

### Step 3: Add to Template Info

```typescript
// constTemplateWrapper.tsx
{
  id: 18,
  code: "new-template",
  title: "New Template",
  subtitle: "Short description",
  description: "Longer description",
  isNew: true,
  backgroundColor: "#color",
  category: "category-id",
}
```

### Step 4: Create Input Component

```typescript
// inputNewTemplate.tsx
import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputNewTemplate: React.FC<InputTemplateProps> = ({ onInputData }) => {
  // Component implementation
};

export default InputNewTemplate;
```

### Step 5: Register in API Handler

```typescript
// mysticQuill.ts
import { generateNewTemplate } from "@quillsocial/app-store/chatgptai/lib/completions/generators/generate-new-template";

const generators: Generators = {
  // ... existing generators
  18: generateNewTemplate,
};
```

### Step 6: Update Input Wrapper

```typescript
// constTemplateWrapper.tsx
const components: { [key: number]: InputTemplateComponent } = {
  // ... existing components
  18: InputNewTemplate,
};
```

---

## Testing

### Unit Testing Generators

```typescript
import { generateFeatureLaunch } from "./generate-feature-launch";

describe("FeatureLaunchGenerator", () => {
  it("should generate feature launch post", async () => {
    const result = await generateFeatureLaunch(
      1,
      "Smart Scheduler",
      "Automate your posting",
      "Schedule posts automatically",
      "https://example.com"
    );

    expect(result).toHaveProperty("tokens");
    expect(result).toHaveProperty("post");
    expect(result.post).toContain("Smart Scheduler");
  });
});
```

### Integration Testing

```typescript
describe("Template Generation API", () => {
  it("should handle feature launch template", async () => {
    const response = await fetch("/api/openai/mysticQuill", {
      method: "POST",
      body: JSON.stringify({
        code: "feature-launch",
        inputs: {
          countInput: 4,
          input: [
            { id: "feature_name", value: "Smart Scheduler" },
            { id: "user_benefit", value: "Saves time" },
            { id: "use_case", value: "Example" },
            { id: "cta_link", value: "https://example.com" },
          ],
        },
      }),
    });

    const data = await response.json();
    expect(data).toHaveProperty("post");
  });
});
```

---

## Performance Considerations

### 1. Caching

Consider implementing caching for frequently used prompts:

```typescript
class CachedGenerator extends BasePostGenerator {
  private cache = new Map<string, GeneratorResponse>();

  async generate(userId: number, ...args: any[]): Promise<GeneratorResponse> {
    const cacheKey = this.getCacheKey(args);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await super.generate(userId, ...args);
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

### 2. Batch Processing

For multiple post generations:

```typescript
async function generateBatch(
  userId: number,
  requests: Array<{ templateId: number; args: any[] }>
): Promise<GeneratorResponse[]> {
  return Promise.all(
    requests.map(({ templateId, args }) => {
      const generator = generators[templateId];
      return generator(userId, ...args);
    })
  );
}
```

---

## Error Handling

### Generator-Level Errors

```typescript
class SafeGenerator extends BasePostGenerator {
  async generate(userId: number, ...args: any[]): Promise<GeneratorResponse> {
    try {
      return await super.generate(userId, ...args);
    } catch (error) {
      console.error(`Generation failed for user ${userId}:`, error);
      return {
        tokens: [],
        post: "Sorry, we couldn't generate content at this time.",
      };
    }
  }
}
```

### API-Level Errors

```typescript
// In mysticQuill.ts
const generatorFunc = generators[numId];
if (!generatorFunc) {
  console.error(`No generator found for template ID: ${numId}`);
  res.status(400).json({ 
    message: "Invalid template ID",
    templateId: numId 
  });
  return;
}
```

---

## Migration Strategy

### Phase 1: Parallel Implementation (Current)
- Old functions still work
- New class-based approach available
- Both can coexist

### Phase 2: Gradual Migration
- Start using `BasePostGenerator` for new templates
- Refactor existing generators one by one
- Update tests incrementally

### Phase 3: Full Migration
- All generators extend `BasePostGenerator`
- Remove old-style functions
- Update all imports

### Phase 4: Optimization
- Implement caching
- Add batch processing
- Performance monitoring

---

## Best Practices

1. **Always extend BasePostGenerator** for new generators
2. **Keep instruction templates clear** and well-formatted
3. **Handle optional parameters gracefully** with default values
4. **Add comprehensive error logging** for debugging
5. **Write tests** for each new generator
6. **Document prompt engineering decisions** in comments
7. **Use TypeScript types** for better type safety
8. **Follow naming conventions** consistently

---

## Troubleshooting

### Issue: Generator not found
**Solution:** Check that template ID matches in:
- `constTemplateWrapper.tsx` (templatesInfo array)
- `mysticQuill.ts` (generators object)
- Generator file exists and is imported

### Issue: Empty response from generator
**Solution:**
- Check input validation in component
- Verify all required fields are provided
- Check OpenAI API limits/errors
- Review prompt formatting

### Issue: Incorrect template ID
**Solution:**
- Verify `getIdFromCode` function
- Check template code matches exactly
- Ensure no duplicate codes exist

---

**Last Updated:** October 13, 2025  
**Version:** 2.0  
**Maintainers:** QuillSocial Engineering Team
