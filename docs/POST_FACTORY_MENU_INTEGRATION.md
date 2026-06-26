# Post Factory - Menu Integration

## Changes Made

### Navigation Menu Item Added

**Location**: `packages/features/shell/Shell.tsx`

Added "Post Factory" menu item to the main navigation array:

```typescript
{
  name: "Post Factory",
  href: "/post-factory",
  icon: PenTool,
  isCurrent: ({ router }) => {
    const path = router.asPath.split("?")[0];
    return path.startsWith("/post-factory");
  },
}
```

### Menu Position
The Post Factory menu item is positioned:
- **After**: Templates
- **Before**: My Content

This placement makes sense because Post Factory is a content creation tool, similar to the Templates feature.

### Menu Properties
- **Name**: "Post Factory"
- **Route**: `/post-factory`
- **Icon**: `PenTool` (writing/editing icon)
- **Active State**: Highlights when the current route starts with `/post-factory`

### Navigation Visibility
The Post Factory menu item will appear in:
- ✅ Desktop navigation sidebar
- ✅ Mobile bottom navigation
- ✅ Mobile "more" menu (if overflow)

### Access
Users can now access the Post Factory page via:
1. Clicking "Post Factory" in the navigation menu
2. Direct URL: `/post-factory`
3. Navigation highlight active when on the page

## Testing
To test the new menu item:
1. Start the development server: `yarn dev`
2. Navigate to `http://localhost:3000`
3. Look for "Post Factory" in the navigation menu
4. Click it to navigate to the Post Factory page
5. Verify the menu item is highlighted when active

## Related Files
- Page Component: `apps/web/pages/post-factory.tsx`
- Navigation: `packages/features/shell/Shell.tsx`
- Documentation: `docs/POST_FACTORY_PAGE.md`
