# Blog Markdown Editor - Image Sizing Guide

## Overview

The BlogMarkdownEditor now supports image resizing with an intuitive toolbar interface.

## How to Change Image Size

### Step-by-Step Instructions

1. **Insert an Image**
   - Click the "Image" button in the toolbar
   - Upload, search Unsplash, or embed a URL
   - Click "Use this Image"

2. **Select the Image**
   - Click on the inserted image in the editor
   - You'll see a blue outline indicating it's selected

3. **Choose a Size**
   - Once selected, size buttons (S, M, L, Full) appear in the toolbar
   - Click the desired size:
     - **S (Small)**: 25% width
     - **M (Medium)**: 50% width
     - **L (Large)**: 75% width
     - **Full**: 100% width

### Visual Feedback

- **Selected images** have a blue outline (3px solid #3b82f6)
- **Size controls** only appear when an image is selected
- All images maintain aspect ratio automatically

## Features

### Image Configuration

```typescript
Image.configure({
  inline: false,          // Block-level for better layout control
  allowBase64: true,      // Support base64 and URLs
  HTMLAttributes: {
    class: 'blog-editor-image',
  },
})
```

### CSS Styling

Images are styled with:
- Rounded corners (0.5rem border-radius)
- Responsive sizing (max-width: 100%)
- Auto height (maintains aspect ratio)
- Clickable cursor
- Selection outline when active

### Size Preset Buttons

| Button | Width | Use Case |
|--------|-------|----------|
| S | 25% | Small inline images, icons |
| M | 50% | Medium illustrations |
| L | 75% | Large featured images |
| Full | 100% | Hero images, banners |

## Technical Implementation

### Image Insertion

```typescript
const handleImageInsert = async (imageSrc: string, cloudFileId?: number) => {
  editor.chain().focus().setImage({ 
    src: imageSrc,
    alt: 'Blog image',
  }).run();
};
```

### Size Control

```typescript
const setImageSize = (width: string) => {
  editor.chain().focus().updateAttributes('image', { 
    style: `width: ${width}; height: auto;` 
  }).run();
};
```

### Selection Detection

```typescript
const isImageSelected = editor?.isActive('image') ?? false;
```

## Advanced Usage

### Custom Sizes

To add custom size options, modify the toolbar buttons:

```tsx
<Button
  onClick={() => setImageSize('33%')}
  tooltip="One-third width"
>
  1/3
</Button>
```

### Keyboard Shortcuts

Currently, image sizing is toolbar-only. To add keyboard shortcuts, extend the Image extension:

```typescript
Image.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-1': () => {
        this.editor.chain().focus()
          .updateAttributes('image', { style: 'width: 25%; height: auto;' })
          .run();
        return true;
      },
    };
  },
})
```

### Direct Markdown Editing

In "View Code" mode, you can't set sizes via standard markdown syntax. However, you can use HTML:

```html
<img src="image.jpg" alt="Description" style="width: 50%; height: auto;" />
```

## Limitations

1. **Markdown Standard**: Standard markdown doesn't support image sizing
2. **Export Compatibility**: Sizes are stored as inline styles in HTML
3. **Percentage-based**: Sizes are relative to container width

## Best Practices

1. **Start with default size** after insertion
2. **Select image first** before changing size
3. **Use appropriate sizes**:
   - Small: Icons, decorative elements
   - Medium: Standard illustrations
   - Large: Important visuals
   - Full: Hero/banner images
4. **Test in preview** to see final rendering

## Troubleshooting

### Size buttons not appearing?
- Ensure the image is selected (blue outline visible)
- Click directly on the image in the editor

### Size not changing?
- Make sure you're in Edit mode (not Preview or Code view)
- Try selecting the image again
- Check that the image was successfully inserted

### Images too large?
- All images max-width is 100% of container
- Use smaller size preset (S or M)
- Consider image file dimensions

## Future Enhancements

Potential improvements:
- [ ] Drag-to-resize handles
- [ ] Alignment controls (left, center, right)
- [ ] Caption support
- [ ] Image gallery/grid layout
- [ ] Lightbox/zoom on click
- [ ] Lazy loading for performance
