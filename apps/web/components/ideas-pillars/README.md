# Outline Drawer Implementation Summary

## Overview
Successfully implemented the **Expand to Outline** feature with a fully separated component architecture following the project's conventions.

## File Structure

```
apps/web/
├── components/
│   └── ideas-pillars/
│       ├── index.ts                 # Barrel export file
│       ├── types.ts                 # Shared TypeScript interfaces
│       └── OutlineDrawer.tsx        # Main drawer component
└── pages/
    └── ideas-pillars.tsx            # Main page (now cleaner, uses separated component)
```

## Created Files

### 1. `/apps/web/components/ideas-pillars/types.ts`
- Defines shared interfaces: `Idea`, `Outline`, and `Tone` type
- Centralized type definitions for reusability across components

### 2. `/apps/web/components/ideas-pillars/OutlineDrawer.tsx`
- **Complete drawer component** with all functionality
- Imports types from `./types.ts`
- Features implemented:
  - ✅ Right-side Sheet/Drawer with proper size (`lg`)
  - ✅ Header with idea snippet (truncated to 56 chars)
  - ✅ Tone selector (friendly/authoritative/contrarian)
  - ✅ Tags display from original idea
  - ✅ "View original idea" link
  - ✅ TextArea editor (min-height 300px, monospace font)
  - ✅ Regenerate button with loading state (800-1200ms mock delay)
  - ✅ Save button (disabled if < 30 chars)
  - ✅ Promote to Post button
  - ✅ Close button with dirty state confirmation
  - ✅ Mock outline generation based on tone
  - ✅ All data-testid attributes for testing

### 3. `/apps/web/components/ideas-pillars/index.ts`
- Barrel export for clean imports
- Exports both component and types

### 4. Updated `/apps/web/pages/ideas-pillars.tsx`
- **Significantly cleaner** (reduced from ~600 lines to ~287 lines)
- Now imports `OutlineDrawer` component
- Imports types from the shared location
- All state management and handlers remain in the page
- Proper integration with existing Ideas & Pillars UI

## Key Features Implemented

### ✅ UI/UX Requirements
1. **Drawer Layout**: Right-side sheet with `w-lg` size
2. **Header Section**:
   - Title: "Outline"
   - Subtitle: "From idea → {snippet}"
   - Close button with X icon
3. **Meta Row**:
   - Tone selector dropdown
   - Idea tags as badges
   - "View original idea" link
4. **Editor Section**:
   - Large textarea (300px min-height)
   - Monospace font for outline text
   - Placeholder text
5. **Footer Actions**:
   - Save Outline (primary, disabled if < 30 chars)
   - Promote to Post (secondary)
   - Close (minimal)

### ✅ State Management
- `outlineDraft` - Current outline text
- `tone` - Selected tone (friendly/authoritative/contrarian)
- `isDirty` - Tracks unsaved changes
- `isGenerating` - Loading state for regeneration

### ✅ Behavior
- **Auto-generate** outline on first open
- **Load existing** outline if available
- **Regenerate** creates new outline based on tone
- **Dirty check** on close (confirms if unsaved changes)
- **Save** upserts outline to state and updates idea status to "Outlined"
- **Promote** calls handler and closes drawer
- **Tone change** marks as dirty

### ✅ Mock Generation Logic
Three tone templates implemented:
- **Friendly**: Casual, approachable language
- **Authoritative**: Professional, direct language
- **Contrarian**: Provocative, challenge-the-norm language

Each generates 6-line outline:
```
Hook: {tone-specific hook}
Lesson 1: ...
Lesson 2: ...
Lesson 3: ...
Example: {idea snippet}... — {result}
CTA: {tone-specific call-to-action}
```

### ✅ Accessibility
- All buttons have `aria-label`
- Tone select has visible label
- Drawer traps focus
- Escape key closes drawer (with dirty check)

### ✅ Telemetry (Console Logs)
- `outline_opened` - When drawer opens
- `outline_generated` - When regenerate is triggered
- `outline_saved` - When outline is saved
- `outline_promoted` - When promoted to post

### ✅ Test Attributes
All required `data-testid` attributes:
- `outline-drawer`
- `outline-textarea`
- `outline-tone`
- `outline-regenerate`
- `outline-save`
- `outline-promote`

## Integration Points

### State in Parent (ideas-pillars.tsx)
```typescript
const [openOutlineForIdeaId, setOpenOutlineForIdeaId] = useState<string | null>(null);
const [outlines, setOutlines] = useState<Outline[]>([]);
```

### Handlers
- `handleExpandToOutline()` - Opens drawer for selected idea
- `handleSaveOutline()` - Upserts outline, updates idea status
- `handlePromoteToPost()` - Shows toast, ready for integration
- `handleCloseOutlineDrawer()` - Closes drawer

### Props Passed to Drawer
```typescript
<OutlineDrawer
  open={openOutlineForIdeaId !== null}
  idea={currentOutlineIdea}
  existingOutline={currentOutline}
  onSave={handleSaveOutline}
  onPromote={handlePromoteToPost}
  onClose={handleCloseOutlineDrawer}
/>
```

## Code Quality

### ✅ Follows Project Conventions
- Uses function components (not arrow functions in exports)
- Imports from `@quillsocial/ui` package
- Uses Lucide React icons
- Proper TypeScript typing
- Component separation pattern matches existing code (see `write/` components)

### ✅ Reusability
- Separated types allow easy reuse
- Component can be imported anywhere
- Mock generation function can be extracted to utils if needed

### ✅ Maintainability
- Clean separation of concerns
- Well-documented with comments
- Single responsibility principle
- Easy to test with data-testid attributes

## Next Steps / TODOs

1. **Backend Integration**: Replace mock state with API calls
2. **Real AI Generation**: Connect regenerate to actual AI service
3. **View Original Idea**: Implement scroll/highlight to idea card
4. **Post Factory Integration**: Wire up "Promote to Post" to actual post creation
5. **Persistence**: Save outlines to database
6. **Enhanced Validation**: More sophisticated validation rules
7. **Keyboard Shortcuts**: Add hotkeys for save, close, regenerate
8. **Auto-save**: Implement debounced auto-save
9. **Rich Text Editor**: Upgrade textarea to support formatting
10. **Collaboration**: Add multi-user editing support

## Testing Checklist

Based on prompt requirements:

- ✅ **TC1**: Clicking "Expand to Outline" opens drawer
- ✅ **TC2**: Changing tone + regenerate updates outline
- ✅ **TC3**: Save creates/updates outline in state
- ✅ **TC4**: Promote calls handler and closes drawer
- ✅ **TC5**: Dirty close shows confirmation

## Performance Considerations

- Component only renders when open
- Efficient state updates with proper dependencies
- No unnecessary re-renders
- Mock delay simulates realistic API call timing

## Browser Compatibility

Uses standard React patterns and Radix UI primitives (Sheet), ensuring cross-browser compatibility.

---

**Status**: ✅ Complete - Ready for development testing and integration
