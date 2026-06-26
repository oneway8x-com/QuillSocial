# Image Upload Utilities

Reusable image upload components and hooks for QuillSocial.

## Overview

This module provides a centralized solution for handling image uploads across the application, supporting multiple sources:
- Direct file upload from computer
- Unsplash image search and selection
- External URL embedding

All images are automatically uploaded to Google Cloud Storage for Instagram API compatibility.

## Files

- **`imageUtils.ts`** - Core utility functions for image conversion and cloud storage
- **`useImageUpload.ts`** - React hook for managing image upload state and operations
- **`index.ts`** - Public exports

## Usage

### In a Component

```typescript
import { useImageUpload } from "@/lib/image-upload";

function MyComponent() {
  const {
    imageSrc,
    cloudFileId,
    isLoading,
    handleImageUpload,
    handleUnsplashImage,
    handleEmbedImage,
    clearImage,
  } = useImageUpload();

  // Use with direct upload
  const onFileSelect = async (base64: string) => {
    await handleImageUpload(base64, 'my-image.jpg');
  };

  // Use with Unsplash
  const onUnsplashSelect = async (url: string) => {
    await handleUnsplashImage(url);
  };

  // Use with external URL
  const onEmbedUrl = async (url: string) => {
    await handleEmbedImage(url);
  };

  return (
    <div>
      {imageSrc && <img src={imageSrc} alt="Preview" />}
      {isLoading && <p>Uploading...</p>}
    </div>
  );
}
```

### With AddImageDialog

The `AddImageDialog` component has been refactored to use these utilities:

```typescript
import { AddImageDialog } from "@/components/write/AddImageDialog";

function MyEditor() {
  const [showDialog, setShowDialog] = useState(false);

  const handleImageInsert = async (imageSrc: string, cloudFileId?: number) => {
    // Insert image into your editor
    console.log('Image URL:', imageSrc);
    console.log('Cloud File ID:', cloudFileId);
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>Insert Image</button>
      <AddImageDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        handleImageChange={handleImageInsert}
      />
    </>
  );
}
```

### With BlogMarkdownEditor

The blog markdown editor now supports image insertion:

```typescript
import { BlogMarkdownEditor } from "@/components/blog-editor/BlogMarkdownEditor";

function BlogPost() {
  const [content, setContent] = useState('');

  return (
    <BlogMarkdownEditor
      value={content}
      onChange={setContent}
      placeholder="Write your blog post..."
    />
  );
}
```

Click the "Image" button in the toolbar to open the image upload dialog.

## API Reference

### `useImageUpload()`

Returns an object with:

- `imageSrc: string` - Current image URL (cloud storage URL or base64)
- `cloudFileId: number | undefined` - Cloud storage file ID
- `isLoading: boolean` - Upload in progress
- `handleImageUpload(imageDataUrl, fileName?)` - Upload from file
- `handleUnsplashImage(imageUrl)` - Upload from Unsplash
- `handleEmbedImage(imageUrl)` - Upload from external URL
- `clearImage()` - Reset all state

### Utility Functions

- `convertImageToBase64(url: string)` - Convert image URL to base64
- `uploadImageToCloudStorage(base64, fileName)` - Upload to Google Cloud Storage
- `isValidImageUrl(url: string)` - Validate image URL
- `getFileExtensionFromBase64(base64)` - Extract file extension
- `compressImageIfNeeded(base64, maxSize)` - Compress large images (placeholder)

## Cloud Storage Integration

All images are uploaded to Google Cloud Storage via:
```
POST /api/integrations/googlecloudstorage/uploadBase64
```

This ensures compatibility with Instagram's API requirements.

### Fallback Behavior

If cloud storage upload fails:
- Image falls back to base64 encoding
- Warning toast shown to user
- Instagram posting may not work with base64 images

## Migration from AddImageDialog

The original `AddImageDialog.tsx` has been refactored to use these utilities. If you have custom image upload logic elsewhere, consider migrating to use `useImageUpload()` for consistency.

## Future Enhancements

- [ ] Implement actual image compression in `compressImageIfNeeded()`
- [ ] Add image resizing options
- [ ] Support drag-and-drop file upload
- [ ] Add progress indicators for large uploads
- [ ] Support multiple image selection
