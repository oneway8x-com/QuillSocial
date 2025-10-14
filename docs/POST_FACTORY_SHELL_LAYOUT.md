# Post Factory - Shell Layout Implementation

## Overview
Updated the Post Factory page to use the QuillSocial Shell layout with left navigation menu, matching the Write page structure.

## Changes Made

### 1. Layout Structure
**Before:** Custom standalone layout with SectionTitle component
**After:** Shell layout with left navigation menu

### 2. Header Integration
- Moved title and subtitle to Shell component props
- Added CTA buttons (Save Draft, Schedule Now) in Shell header
- Removed custom SectionTitle component

### 3. Icon Updates
Fixed all icon imports to use correct Lucide icon names:
```typescript
// Updated imports
import {
  PenTool,       // ✅ For writing/editing
  CalendarDays,  // ✅ For calendar actions  
  Copy,          // ✅ For copy action
  Save,          // ✅ For save action
  Wand           // ✅ For AI generation
} from "@quillsocial/ui/components/icon";
```

### 4. Main Content Area
Preserved the original design from the image:

**Input Section (Left - 1/3 width):**
- Outline textarea
- Tone selection (Friendly, Authoritative, Contrarian) - now as buttons
- Platform selection buttons
- Generate All button

**Output Section (Right - 2/3 width):**
- Tab navigation (LinkedIn, X Thread, IG Carousel, Shorts, Blog)
- Content textarea/preview area
- CTA and UTM parameter inputs
- Copy and Regenerate buttons

### 5. UI Enhancements
- Changed tone selector from dropdown to button group
- Added shadow-sm to cards for better depth
- Consistent rounded-xl styling throughout
- Improved responsive layout with lg:col-span patterns

### 6. Button Actions
- **Save Draft** - Secondary button in header
- **Schedule Now** - Primary button in header  
- **Generate All** - Primary action in input section
- **Copy** - Copies current tab content to clipboard
- **Regenerate** - Re-generates content for active tab

## Layout Comparison

### With Shell Layout (Current)
```
┌─────────────────────────────────────────┐
│ [Left Menu] │ Header (Post Factory)     │
│             │ [Save Draft][Schedule Now]│
├─────────────┼───────────────────────────┤
│             │ ┌─────┐ ┌───────────────┐ │
│ Navigation  │ │Input│ │   Outputs     │ │
│   Items     │ │     │ │               │ │
│             │ │     │ │   Tabs...     │ │
│             │ └─────┘ └───────────────┘ │
└─────────────┴───────────────────────────┘
```

## Features Preserved
✅ Two-column layout (Input | Outputs)
✅ Tone selection functionality  
✅ Platform toggles
✅ Multi-tab output system
✅ IG Carousel grid view
✅ CTA and UTM inputs
✅ Copy and Regenerate actions
✅ Toast notifications

## New Features with Shell
✅ Left navigation menu (consistent with app)
✅ Header with title and action buttons
✅ Proper page routing and authentication
✅ Responsive mobile layout
✅ Consistent UI/UX with other pages

## File Structure
```
apps/web/pages/post-factory.tsx
├── Imports (React, Shell, UI components, icons)
├── Interface (Tab type)
├── PostFactoryPage Component
│   ├── State management
│   ├── Event handlers
│   └── JSX
│       ├── HeadSeo
│       └── Shell
│           ├── CTA (header buttons)
│           └── Content
│               ├── Input Section
│               └── Output Section
└── Export with PageWrapper
```

## Browser Access
- **URL**: `/post-factory`
- **Menu**: "Post Factory" in left navigation
- **Requires**: Authentication via Shell

## Next Steps (TODO)
1. Integrate AI generation service for "Generate All"
2. Connect scheduling system for "Schedule Now"
3. Implement draft save/load functionality
4. Add platform-specific templates
5. Character count per platform
6. Real-time content preview
7. Analytics tracking

## Related Files
- Page: `apps/web/pages/post-factory.tsx`
- Navigation: `packages/features/shell/Shell.tsx`
- Icons: `packages/ui/components/icon/Icon.tsx`
