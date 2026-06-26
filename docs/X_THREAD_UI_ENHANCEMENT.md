# X/Twitter Thread UI Enhancement

## Overview
Enhanced the Post Factory page to display X/Twitter content as an editable numbered thread, matching the requested UI format with individual editable items.

## Changes Made

### 1. Added Thread Parsing Helper Function
```typescript
function parseXThread(content: string): string[]
```
- Parses generated X content into individual tweet items
- Handles numbered format (1/, 2/, 3/, etc.)
- Fallback to splitting by newlines if no numbered pattern found

### 2. State Management
Added `xThreadItems` state to track individual tweets:
```typescript
const [xThreadItems, setXThreadItems] = useState<string[]>([...])
```

### 3. Updated Mutations
Modified `generateAllMutation` and `regenerateMutation` to:
- Parse X content into thread items on success
- Update `xThreadItems` state automatically

### 4. New UI Component
Created custom thread editor for X platform in the output section:
- **Numbered badges**: Each tweet shows a numbered circle (1, 2, 3, etc.)
- **Individual TextAreas**: Each tweet is editable independently
- **Delete button**: Remove individual tweets with × button
- **Add tweet button**: Add new tweets to the thread
- **Auto-sync**: Changes sync back to the `outputs.x` value

## UI Features

### Display Format
```
[1] [Editable TextArea...] [×]
[2] [Editable TextArea...] [×]
[3] [Editable TextArea...] [×]
+ Add tweet
```

### Interactions
- **Edit**: Click any TextArea to edit that specific tweet
- **Delete**: Click × to remove a tweet (auto-renumbers remaining)
- **Add**: Click "+ Add tweet" to append a new item
- **Real-time sync**: Changes update the underlying `outputs.x` string

## Technical Details

### Parsing Logic
1. First tries to split by numbered pattern (`\d+/\s*`)
2. Falls back to double newlines if no numbering
3. Last resort: splits by single newlines

### Data Flow
1. Backend generates X content as string
2. `parseXThread()` converts to array
3. User edits individual items in UI
4. `onChange` rebuilds the full string: `"1/ text\n\n2/ text\n\n3/ text"`
5. Updated string stored in `outputs.x`

## Benefits
- ✅ Better UX for Twitter thread editing
- ✅ Visual clarity with numbered items
- ✅ Easy to reorder/remove tweets
- ✅ Matches requested design pattern
- ✅ Maintains compatibility with backend

## Files Modified
- `/apps/web/pages/post-factory.tsx`:
  - Added `parseXThread()` helper function
  - Added `xThreadItems` state
  - Updated mutations to parse X content
  - Created custom thread UI component
  - Added delete/add functionality

## Usage Example
1. Generate content with "Generate All" button
2. Switch to "X / Twitter" tab
3. See numbered thread with individual editable items
4. Edit any tweet directly
5. Add or remove tweets as needed
6. Copy final content or save to scheduling

## Next Steps (Optional Enhancements)
- [ ] Drag-and-drop reordering
- [ ] Character count per tweet (280 limit)
- [ ] Thread preview in X-style cards
- [ ] Auto-split long tweets
- [ ] Thread optimization suggestions
