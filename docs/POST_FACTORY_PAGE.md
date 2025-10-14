# Post Factory Page

## Overview
The Post Factory page is a content creation tool that allows users to transform a single outline into multiple platform-specific content formats. This feature streamlines the content creation process by generating variations optimized for different social media platforms from one source.

## Location
- **File Path**: `apps/web/pages/post-factory.tsx`
- **Route**: `/post-factory`

## Features

### Input Section
- **Outline Editor**: Multi-line text area for entering content outlines
- **Tone Selection**: Choose between friendly, authoritative, or contrarian tones
- **Platform Selection**: Toggle between LinkedIn, X (Twitter), Instagram, YouTube, and Blog
- **Generate All Button**: Trigger AI-powered content generation for all selected platforms

### Output Section
- **Multi-Format Tabs**: Switch between different platform outputs
  - LinkedIn Post
  - X (Twitter) Thread
  - IG Carousel (10-slide preview grid)
  - YouTube Shorts Script
  - Blog/Newsletter
- **Editable Outputs**: Each format can be manually edited
- **CTA & UTM Configuration**: Customize call-to-action text and UTM parameters
- **Action Buttons**:
  - Copy: Copy current tab content to clipboard
  - Regenerate: Re-generate content for current tab
  - Save Draft: Save as draft
  - Schedule Now: Navigate to calendar for scheduling

## Components Used

### From `@quillsocial/ui`
- `HeadSeo`: Page metadata
- `Button`: Action buttons with icon support
- `TextArea`: Multi-line input fields
- `showToast`: Success/error notifications

### Icons (from lucide-react via `@quillsocial/ui/components/icon`)
- `PenLine`: Page title icon
- `Calendar`: Schedule button icon
- `Copy`: Copy button icon
- `Save`: Save draft icon
- `Wand2`: Generate/Regenerate icon

### Layout
- `PageWrapper`: Standard page wrapper component
- `Shell`: Application shell for navigation

## State Management

```typescript
const [outline, setOutline] = useState<string>("");
const [tone, setTone] = useState<string>("authoritative");
const [activeTab, setActiveTab] = useState<string>("linkedin");
const [cta, setCta] = useState<string>("");
const [utm, setUtm] = useState<string>("");
const [outputs, setOutputs] = useState<Record<string, string>>({
  linkedin: "",
  x: "",
  carousel: "",
  shorts: "",
  blog: ""
});
```

## Integration Points

### TODO Items
1. **AI Generation**: Integrate with AI service to generate platform-specific content
   - Hook into existing AI generation service
   - Pass outline, tone, and platform parameters
   - Update outputs state with generated content

2. **Scheduling System**: Connect to existing calendar/scheduling functionality
   - Save generated content to database
   - Link to scheduling API
   - Navigate to calendar view with pre-filled content

3. **Draft Management**: Implement draft save/load functionality
   - Store drafts in database
   - Associate with user account
   - Provide draft selection/loading interface

4. **Platform Templates**: Add template system for different content types
   - Define templates per platform
   - Allow customization of output structure
   - Save user preferences

## Usage

### Navigation
Users can access the Post Factory page via:
- Direct URL: `/post-factory`
- Navigation menu (if added to Shell)

### Workflow
1. Enter content outline in the input section
2. Select desired tone and platforms
3. Click "Generate All" to create content variations
4. Review and edit each platform's output
5. Customize CTA and UTM parameters
6. Copy content or schedule posts

## Styling
- Uses Tailwind CSS for styling
- Consistent with QuillSocial design system
- Rounded corners (rounded-xl) for modern look
- Color scheme: Indigo primary, slate neutral

## Future Enhancements
- [ ] Real-time preview for each platform
- [ ] Character count indicators per platform
- [ ] Image/media attachment support
- [ ] Bulk scheduling across platforms
- [ ] Content history and versioning
- [ ] AI-powered optimization suggestions
- [ ] A/B testing variant generation
- [ ] Analytics integration for performance tracking
