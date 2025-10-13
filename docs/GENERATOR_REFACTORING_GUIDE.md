# Generator Refactoring Guide

This guide will help you refactor existing generator functions to use the new `BasePostGenerator` class and follow SOLID principles.

## 🎯 Goals

- ✅ Reduce code duplication
- ✅ Improve maintainability
- ✅ Enable easier testing
- ✅ Follow SOLID principles
- ✅ Maintain backward compatibility

---

## 📋 Refactoring Checklist

### Before You Start

- [ ] Read [GENERATOR_SYSTEM_TECHNICAL.md](./GENERATOR_SYSTEM_TECHNICAL.md)
- [ ] Understand the Template Method pattern
- [ ] Review `base-generator.ts` implementation
- [ ] Have tests ready (create if missing)

### For Each Generator

- [ ] Create new class extending `BasePostGenerator`
- [ ] Implement `buildInstruction` method
- [ ] Keep factory function for backward compatibility
- [ ] Run tests to verify behavior
- [ ] Update imports if needed

---

## 🔄 Step-by-Step Process

### Step 1: Analyze Current Generator

Look at your current generator structure:

```typescript
// OLD: generate-example.ts
import { getRewriteCompletions } from "../getChatCompletions";

const getMessageTexts = (param1: string, param2: string, format?: string) => {
  const instruction = format
    ? `Create a post with format: ${format}\nParam1: ${param1}\nParam2: ${param2}`
    : `Create a post.\nParam1: ${param1}\nParam2: ${param2}`;
  return instruction;
};

export const generateExample = async (
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

**Identify:**
- Parameters: `userId`, `param1`, `param2`, `format?`
- Instruction building logic in `getMessageTexts`
- Common boilerplate (token extraction, string cleaning)

---

### Step 2: Create Generator Class

Create a new class extending `BasePostGenerator`:

```typescript
// NEW: generate-example.ts (refactored)
import { BasePostGenerator } from "./base-generator";

class ExampleGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [param1, param2] = args;
    
    // Validate required parameters
    const p1 = this.getStringValue(param1);
    const p2 = this.getStringValue(param2);

    // Build base instruction
    let instruction = `Create a post.\nParam1: ${p1}\nParam2: ${p2}`;

    // Add format if provided
    if (format) {
      instruction = `Create a post with format: ${format}\n` + instruction;
    }

    return instruction;
  }
}

// Factory function for backward compatibility
export const generateExample = async (
  userId: number,
  param1: string,
  param2: string,
  format?: string
) => {
  const generator = new ExampleGenerator();
  return await generator.generate(userId, param1, param2, format);
};
```

**Key Changes:**
- ✅ Moved instruction logic to `buildInstruction`
- ✅ Used `getStringValue` helper for string sanitization
- ✅ Removed boilerplate (handled by base class)
- ✅ Kept factory function (existing code still works)

---

### Step 3: Handle Complex Instructions

For generators with complex prompt engineering:

```typescript
class ComplexGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [feature, benefit, useCase, ctaLink] = args;
    
    // Clean and validate inputs
    const featureName = this.getStringValue(feature);
    const userBenefit = this.getStringValue(benefit);
    const useCaseText = this.getStringValue(useCase);
    const cta = this.getStringValue(ctaLink);

    // Build multi-part instruction
    const sections = [
      "🚀 You're announcing a new feature launch.",
      "",
      `Feature: ${featureName}`,
      `User Benefit: ${userBenefit}`,
      `Use Case: ${useCaseText}`,
      `CTA Link: ${cta}`,
      "",
      "Guidelines:",
      "- Start with an attention-grabbing hook",
      "- Explain the problem this solves",
      "- Highlight the main benefit",
      "- Include a clear call-to-action",
      "- Keep it concise and impactful",
    ];

    let instruction = sections.join("\n");

    // Add format instructions if needed
    if (format) {
      instruction += this.buildFormatInstruction(format);
    }

    return instruction;
  }
}
```

**Tips:**
- Use array for multi-line instructions (easier to read)
- Group related parts with blank lines
- Use helper methods (`buildFormatInstruction`)
- Keep guidelines consistent across templates

---

### Step 4: Test the Refactored Generator

Create or update tests:

```typescript
// generate-example.test.ts
import { generateExample } from "./generate-example";

describe("ExampleGenerator", () => {
  describe("Basic functionality", () => {
    it("should generate post with required parameters", async () => {
      const result = await generateExample(
        1,
        "Test Param 1",
        "Test Param 2"
      );

      expect(result).toHaveProperty("tokens");
      expect(result).toHaveProperty("post");
      expect(result.post).toBeTruthy();
    });

    it("should include parameters in generated content", async () => {
      const result = await generateExample(
        1,
        "Smart Feature",
        "Easy Integration"
      );

      // Basic sanity check
      expect(result.post.length).toBeGreaterThan(0);
    });
  });

  describe("Format handling", () => {
    it("should handle format parameter", async () => {
      const result = await generateExample(
        1,
        "Test",
        "Value",
        "Twitter thread (5 tweets)"
      );

      expect(result.post).toBeTruthy();
    });

    it("should work without format parameter", async () => {
      const result = await generateExample(1, "Test", "Value");
      expect(result.post).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters", async () => {
      const result = await generateExample(
        1,
        'Test "quotes"',
        "Test's apostrophe"
      );

      expect(result.post).toBeTruthy();
    });

    it("should handle empty strings", async () => {
      const result = await generateExample(1, "", "");
      expect(result.post).toBeTruthy();
    });
  });
});
```

**Run tests:**
```bash
npm test generate-example.test.ts
```

---

### Step 5: Update Exports

Ensure the refactored generator is properly exported:

```typescript
// generators/index.ts
export { generateExample } from "./generate-example";

// If also exporting the class
export { ExampleGenerator } from "./generate-example";
```

---

## 📊 Refactoring Progress Tracker

Track your progress refactoring all 17 generators:

### ✅ Completed
- [x] generate-feature-launch.ts (Example in base-generator.ts)

### 🔄 In Progress
- [ ] _Your current generator_

### ⏳ Pending

#### Product Launch Category
- [ ] generate-sneak-peek.ts
- [ ] generate-problem-solution.ts
- [ ] generate-user-feedback.ts

#### Educational Category
- [ ] generate-how-it-works.ts
- [ ] generate-before-after.ts
- [ ] generate-valuable-tips.ts

#### Story & Narrative Category
- [ ] generate-founder-voice.ts
- [ ] generate-struggle.ts
- [ ] generate-small-mighty.ts

#### Engagement Category
- [ ] generate-book-learning.ts
- [ ] generate-recent-learning.ts
- [ ] generate-favourite-tool.ts
- [ ] generate-changelog.ts

#### General Category
- [ ] generate-from-scratch.ts
- [ ] generate-from-article.ts
- [ ] generate-format-content.ts

---

## 🎓 Common Patterns

### Pattern 1: Simple Two-Parameter Generator

```typescript
class SimpleGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [topic, details] = args;
    
    let instruction = `Write about ${this.getStringValue(topic)}.\nDetails: ${this.getStringValue(details)}`;
    
    if (format) {
      instruction += this.buildFormatInstruction(format);
    }
    
    return instruction;
  }
}
```

### Pattern 2: Multi-Parameter with Validation

```typescript
class ValidatedGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [name, benefit, useCase, link] = args;
    
    // Validate and clean all inputs
    const cleanName = this.getStringValue(name);
    const cleanBenefit = this.getStringValue(benefit);
    const cleanUseCase = this.getStringValue(useCase);
    const cleanLink = this.getStringValue(link);

    // Build instruction with validation
    if (!cleanName || !cleanBenefit) {
      throw new Error("Name and benefit are required");
    }

    return `Feature: ${cleanName}\nBenefit: ${cleanBenefit}\nUse Case: ${cleanUseCase}\nCTA: ${cleanLink}`;
  }
}
```

### Pattern 3: Complex Multi-Section

```typescript
class ComplexGenerator extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const sections = this.buildSections(args);
    const guidelines = this.buildGuidelines();
    
    let instruction = [...sections, "", ...guidelines].join("\n");
    
    if (format) {
      instruction += this.buildFormatInstruction(format);
    }
    
    return instruction;
  }

  private buildSections(args: any[]): string[] {
    // Custom section building logic
    return [
      "Section 1: ...",
      "Section 2: ...",
    ];
  }

  private buildGuidelines(): string[] {
    return [
      "Guidelines:",
      "- Point 1",
      "- Point 2",
    ];
  }
}
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Not Handling Optional Parameters

```typescript
// ❌ BAD - Will crash if format is undefined
protected buildInstruction(args: any[], format: string): string {
  return `Format: ${format.toLowerCase()}...`; // Error if format is undefined!
}

// ✅ GOOD - Handle optional parameter
protected buildInstruction(args: any[], format?: string): string {
  const formatInstruction = format ? this.buildFormatInstruction(format) : "";
  return `Base instruction...${formatInstruction}`;
}
```

### Pitfall 2: Not Sanitizing Inputs

```typescript
// ❌ BAD - Direct use without sanitization
protected buildInstruction(args: any[]): string {
  const [name] = args;
  return `Name: ${name}`; // Could have quotes, special chars
}

// ✅ GOOD - Use helper method
protected buildInstruction(args: any[]): string {
  const [name] = args;
  return `Name: ${this.getStringValue(name)}`;
}
```

### Pitfall 3: Breaking Backward Compatibility

```typescript
// ❌ BAD - Existing code breaks
export class ExampleGenerator extends BasePostGenerator {
  // Only class export, no factory function
}

// ✅ GOOD - Keep factory function
export class ExampleGenerator extends BasePostGenerator { ... }

export const generateExample = async (...args) => {
  const generator = new ExampleGenerator();
  return await generator.generate(...args);
};
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

Test the generator in isolation:

```typescript
describe("Generator Unit Tests", () => {
  it("should build correct instruction", () => {
    const generator = new ExampleGenerator();
    const instruction = generator["buildInstruction"](
      ["param1", "param2"],
      undefined
    );
    expect(instruction).toContain("param1");
  });
});
```

### 2. Integration Tests

Test the full generation flow:

```typescript
describe("Generator Integration Tests", () => {
  it("should generate complete post", async () => {
    const result = await generateExample(1, "test", "value");
    expect(result).toMatchObject({
      tokens: expect.any(Array),
      post: expect.any(String),
    });
  });
});
```

### 3. Regression Tests

Ensure refactored version produces same results:

```typescript
describe("Generator Regression Tests", () => {
  it("should match old implementation output structure", async () => {
    const result = await generateExample(1, "test", "value");
    
    // Check structure hasn't changed
    expect(result).toHaveProperty("tokens");
    expect(result).toHaveProperty("post");
    expect(typeof result.post).toBe("string");
    expect(Array.isArray(result.tokens)).toBe(true);
  });
});
```

---

## 📈 Measuring Success

After refactoring, verify:

### Code Quality Metrics

- **Lines of Code:** Should decrease (less duplication)
- **Cyclomatic Complexity:** Should decrease (simpler logic)
- **Test Coverage:** Should increase (easier to test)
- **Maintainability Index:** Should increase

### Functional Metrics

- **All tests pass:** Green check ✅
- **No regressions:** Same output format
- **API compatibility:** Existing code still works
- **Performance:** No significant degradation

---

## 🚀 Migration Timeline

### Week 1: Foundation
- [x] Create base-generator.ts
- [x] Refactor one example (feature-launch)
- [x] Create documentation

### Week 2-3: Core Generators
- [ ] Refactor Product Launch category (4 generators)
- [ ] Refactor Educational category (3 generators)
- [ ] Update tests

### Week 4: Advanced Generators
- [ ] Refactor Story & Narrative category (3 generators)
- [ ] Refactor Engagement category (4 generators)
- [ ] Update tests

### Week 5: General Generators
- [ ] Refactor General category (3 generators)
- [ ] Update API handler to use registry
- [ ] Final testing

### Week 6: Cleanup
- [ ] Remove old code (if fully migrated)
- [ ] Update all documentation
- [ ] Performance optimization
- [ ] Code review

---

## 💡 Tips for Success

1. **Refactor one at a time** - Don't try to do all at once
2. **Test after each refactor** - Catch issues early
3. **Keep commits small** - Easy to review and revert
4. **Document as you go** - Update docs incrementally
5. **Ask for code reviews** - Get feedback from team
6. **Monitor production** - Watch for any issues

---

## 🆘 Need Help?

### Common Questions

**Q: Can I skip the factory function?**
A: No! Keep it for backward compatibility. Existing code depends on it.

**Q: Should I refactor all at once?**
A: No, do one at a time. Test thoroughly between refactors.

**Q: What if my generator is very different?**
A: That's okay! The base class is flexible. You can override methods if needed.

**Q: How do I handle special cases?**
A: Override `generate()` method or add custom methods to your class.

### Resources

- [GENERATOR_SYSTEM_TECHNICAL.md](./GENERATOR_SYSTEM_TECHNICAL.md) - Architecture details
- [POST_TEMPLATES_GUIDE.md](./POST_TEMPLATES_GUIDE.md) - Template specifications
- `base-generator.ts` - Base class source code
- `refactored/generate-feature-launch.ts` - Complete example

---

**Last Updated:** January 2025  
**Status:** Active Migration  
**Next Review:** After Week 3 completion
