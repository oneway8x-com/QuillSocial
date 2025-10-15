# Frontend Updated for New JSON Format

## ✅ Changes Completed

### Files Modified

1. **`apps/web/pages/post-factory.tsx`**
   - ✅ Added `carouselSlides` state similar to `xThreadItems`
   - ✅ Updated `generateAllMutation` to handle array format for X and Carousel
   - ✅ Updated `regenerateMutation` to handle array format
   - ✅ Updated `useEffect` to parse and load existing posts with array format
   - ✅ Updated carousel tab UI to show editable slides (like X thread)
   - ✅ Added slide management (add/remove slides)

2. **`packages/trpc/server/routers/viewer/postFactory/saveGeneratedPosts.schema.ts`**
   - ✅ Updated schema to accept `z.union([z.string(), z.array(z.string())])`

## How It Works

### Data Flow

#### Backend → Frontend
```typescript
// Agent returns
{
  linkedin: "string",
  x: ["tweet1", "tweet2", "tweet3"],           // Array
  carousel: ["slide1", "slide2", "slide3"],    // Array  
  shorts: "string",
  blog: "string"
}

// Frontend converts arrays to strings for textarea
outputs.x = xArray.join('\n\n')
outputs.carousel = carouselArray.join('\n\n')

// But keeps separate arrays for editing
xThreadItems = xArray
carouselSlides = carouselArray
```

#### Frontend Display

**X Thread Tab:**
- Individual editable text areas for each tweet
- Numbered badges (1, 2, 3...)
- Add/remove tweet buttons
- Auto-updates joined string in outputs

**Carousel Tab:**
- Individual editable text areas for each slide
- Numbered badges (1, 2, 3...)
- Add/remove slide buttons
- Placeholder shows format: "Slide X: Title\n\n• Point 1..."
- Auto-updates joined string in outputs

**Other Tabs (LinkedIn, Shorts, Blog):**
- Single textarea (string format)

### Backward Compatibility

The code handles both formats:
```typescript
// If API returns array (new format)
const threadItems = Array.isArray(data.outputs.x)
  ? data.outputs.x
  : parseXThread(data.outputs.x as string);

// If API returns string (old format or fallback)
// parseXThread() splits it into array
```

## User Experience

### Carousel Editing
Users can now:
- ✅ See each slide separately
- ✅ Edit individual slides
- ✅ Add new slides with template
- ✅ Remove unwanted slides
- ✅ Maintain consistent formatting

### X Thread Editing
Users can now:
- ✅ See each tweet separately
- ✅ Edit individual tweets
- ✅ Add new tweets
- ✅ Remove unwanted tweets
- ✅ View character counts per tweet (existing)

## Database Storage

The `Post.multiPlatformOutputs` field is JSON type, which supports:
```json
{
  "linkedin": "string content",
  "x": ["tweet1", "tweet2", "tweet3"],
  "carousel": ["slide1", "slide2", "slide3"],
  "shorts": "string content",
  "blog": "string content"
}
```

No migration needed - JSON field accepts both formats automatically.

## Testing Checklist

- [ ] Generate new posts with all platforms
- [ ] Verify X returns array of tweets
- [ ] Verify Carousel returns array of slides
- [ ] Verify LinkedIn, Shorts, Blog return strings
- [ ] Edit individual X tweets
- [ ] Edit individual Carousel slides
- [ ] Add/remove tweets and slides
- [ ] Save to database and reload
- [ ] Regenerate individual platforms
- [ ] Copy content functionality works
- [ ] Load existing saved posts

## Summary

The frontend now fully supports the new JSON format with:
- ✅ Array format for X (tweets) and Carousel (slides)
- ✅ String format for LinkedIn, Shorts, Blog
- ✅ Individual editing UI for array-based platforms
- ✅ Backward compatibility with old string format
- ✅ Proper type safety in schemas
- ✅ No database migration required
