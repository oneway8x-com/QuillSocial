# SOLID Refactoring - Quick Reference Card

**Last Updated:** January 2025 | **Status:** 1/17 Complete (6%)

---

## 📋 Refactoring Checklist

```
┌─────────────────────────────────────────┐
│ BEFORE YOU START                        │
├─────────────────────────────────────────┤
│ ☐ Read GENERATOR_SYSTEM_TECHNICAL.md   │
│ ☐ Review base-generator.ts             │
│ ☐ Check existing generator tests       │
│ ☐ Create new branch                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ REFACTORING STEPS                       │
├─────────────────────────────────────────┤
│ 1. ☐ Create generator class            │
│ 2. ☐ Implement buildInstruction()      │
│ 3. ☐ Add factory function              │
│ 4. ☐ Run tests                          │
│ 5. ☐ Update progress tracker            │
│ 6. ☐ Commit changes                     │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start Template

```typescript
// 1. Create class extending BasePostGenerator
import { BasePostGenerator } from "./base-generator";

class YourGenerator extends BasePostGenerator {
  // 2. Implement buildInstruction (the only required method)
  protected buildInstruction(args: any[], format?: string): string {
    // Extract parameters
    const [param1, param2] = args;
    
    // Clean inputs
    const clean1 = this.getStringValue(param1);
    const clean2 = this.getStringValue(param2);
    
    // Build instruction
    let instruction = `Your prompt here with ${clean1} and ${clean2}`;
    
    // Add format if provided
    if (format) {
      instruction += this.buildFormatInstruction(format);
    }
    
    return instruction;
  }
}

// 3. Export factory function (backward compatibility)
export const generateYourTemplate = async (
  userId: number,
  param1: string,
  param2: string,
  format?: string
) => {
  const generator = new YourGenerator();
  return await generator.generate(userId, param1, param2, format);
};
```

---

## 🎯 Progress Tracker

### ✅ COMPLETE (1)
- [x] Feature Launch

### 🔄 IN PROGRESS (0)
- [ ] _Pick your next generator_

### ⏳ PRODUCT LAUNCH (3 remaining)
- [ ] Sneak Peek / Beta
- [ ] Problem → Solution
- [ ] Built from Feedback

### ⏳ EDUCATIONAL (3 remaining)
- [ ] How It Works
- [ ] Before & After
- [ ] Share Valuable Tips

### ⏳ STORY & NARRATIVE (3 remaining)
- [ ] Founder Voice
- [ ] Share Your Struggle
- [ ] Small but Mighty

### ⏳ ENGAGEMENT (4 remaining)
- [ ] Share Book Learnings
- [ ] Share Recent Learning
- [ ] Share Favorite Tool
- [ ] Weekly Changelog

### ⏳ GENERAL (3 remaining)
- [ ] Start from Scratch
- [ ] Article to Post
- [ ] Format Your Content

---

## 💡 Common Patterns

### Pattern 1: Simple (2-3 params)
```typescript
class SimpleGen extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const [a, b] = args;
    return `Prompt: ${this.getStringValue(a)}, ${this.getStringValue(b)}`;
  }
}
```

### Pattern 2: Multi-Section
```typescript
class MultiSectionGen extends BasePostGenerator {
  protected buildInstruction(args: any[], format?: string): string {
    const sections = [
      "Section 1: ...",
      "",
      "Section 2: ...",
      "",
      "Guidelines:",
      "- Point 1",
      "- Point 2"
    ];
    return sections.join("\n") + (format ? this.buildFormatInstruction(format) : "");
  }
}
```

---

## ⚠️ Common Pitfalls

| ❌ DON'T | ✅ DO |
|---------|-------|
| Use params directly | Use `this.getStringValue(param)` |
| Forget format handling | Check `if (format)` |
| Remove factory function | Keep for backward compatibility |
| Skip tests | Run tests after every refactor |

---

## 🧪 Testing Commands

```bash
# Run tests for specific generator
npm test generate-your-template.test.ts

# Run all generator tests
npm test generators/

# Check test coverage
npm test -- --coverage
```

---

## 📊 Success Metrics

**After refactoring, verify:**

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Code reduced by ~50-70%
- ✅ Factory function works
- ✅ Format handling works

---

## 🔗 Documentation Links

- 📘 [Full Technical Guide](./GENERATOR_SYSTEM_TECHNICAL.md)
- 📗 [Refactoring Guide](./GENERATOR_REFACTORING_GUIDE.md)
- 📙 [Implementation Summary](./SOLID_REFACTORING_SUMMARY.md)
- 📕 [Template Specs](./POST_TEMPLATES_GUIDE.md)

---

## 🎓 Helper Methods Available

```typescript
// In BasePostGenerator class:

// Clean and sanitize string input
this.getStringValue(value: any): string

// Build format instruction section
this.buildFormatInstruction(format: string): string

// Execute generation (already implemented)
this.executeGeneration(userId, instruction): Promise<Response>

// Extract format from args (already implemented)
this.extractFormat(args: any[]): string | undefined
```

---

## 📅 Timeline

| Week | Target | Status |
|------|--------|--------|
| 1 | Foundation + 1 example | ✅ Done |
| 2-3 | Product Launch + Educational (7) | 🔄 Current |
| 4 | Story + Engagement (7) | ⏳ Next |
| 5 | General + API update (3) | ⏳ Later |
| 6 | Polish + Deploy | ⏳ Final |

---

## 💬 Quick Q&A

**Q: What if my generator is complex?**  
A: Use helper methods in your class. Override `generate()` if needed.

**Q: Should I remove the old code?**  
A: No! Keep factory function for backward compatibility.

**Q: How do I test?**  
A: Copy existing tests, verify same behavior.

**Q: Can I skip a generator?**  
A: Yes, but update tracker so team knows.

---

## 🚨 Need Help?

1. Check the [Refactoring Guide](./GENERATOR_REFACTORING_GUIDE.md)
2. Review [example implementation](../packages/app-store/chatgptai/lib/completions/generators/refactored/generate-feature-launch.ts)
3. Ask in team Slack
4. Schedule pairing session

---

## ✨ Remember

> **"Refactor one generator at a time, test thoroughly, commit often."**

- Don't rush - quality over speed
- Follow the patterns consistently
- Update docs as you go
- Celebrate small wins 🎉

---

**Next Action:** Pick a generator, follow the template, run tests, commit!

