# Post Factory Schedule Implementation Summary

## Overview
Added publish/schedule functionality for both LinkedIn and X (Twitter) to the Post Factory Output Panel, similar to the implementation in the write screen.

## Changes Made

### File: `apps/web/components/post-factory/OutputPanel.tsx`

#### 1. **New Imports**
- Added `ScheduleDialog` component import from write components
- Added `PluginType` type import for schedule plugin data

#### 2. **State Management**
Added separate state management for LinkedIn and X scheduling:
```typescript
const [isLinkedinScheduleOpen, setIsLinkedinScheduleOpen] = useState(false);
const [isXScheduleOpen, setIsXScheduleOpen] = useState(false);
const [linkedinScheduleDateTime, setLinkedinScheduleDateTime] = useState("");
const [xScheduleDateTime, setXScheduleDateTime] = useState("");
```

#### 3. **Integration Queries**
- Added X integration query to check if X is installed and connected
- Kept existing LinkedIn integration query
- Query both platforms' social accounts from `getSocialNetWorking`

#### 4. **Account Detection**
```typescript
const linkedinAccount = socialAccounts?.find(
  (account) => account.appId === "linkedin-social"
);

const xAccount = socialAccounts?.find(
  (account) => account.appId === "xconsumerkeys-social"
);

const hasLinkedinAccount = linkedinIntegration?.items?.some(
  (item) => item.credentialIds.length > 0
);

const hasXAccount = xIntegration?.items?.some(
  (item) => item.credentialIds.length > 0
);
```

#### 5. **Handler Functions**

**LinkedIn Handlers:**
- `handleLinkedinPublish()` - Handles immediate publishing to LinkedIn
- `handleLinkedinSchedule()` - Opens LinkedIn schedule dialog
- `handleLinkedinScheduleUpdate()` - Handles scheduled post update
- `handleInstallLinkedIn()` - Redirects to LinkedIn installation

**X Handlers:**
- `handleXPublish()` - Handles immediate publishing to X
- `handleXSchedule()` - Opens X schedule dialog
- `handleXScheduleUpdate()` - Handles scheduled post update
- `handleInstallX()` - Redirects to X installation

#### 6. **UI Components**

**LinkedIn Section** (shown when `activeTab === "linkedin"`):
- Displays connected LinkedIn account with avatar, name, and email
- Shows Publish and Schedule buttons
- If no account connected, shows "Install LinkedIn" button
- Uses blue gradient background (from-blue-50 to-indigo-50)

**X Section** (shown when `activeTab === "x"`):
- Displays connected X account with avatar, name, and email
- Shows Publish and Schedule buttons
- If no account connected, shows "Install X" button
- Uses sky gradient background (from-sky-50 to-blue-50)
- Buttons are disabled if both `outputs.x` is empty AND `xThreadItems` array is empty

#### 7. **Schedule Dialogs**
Added two separate `ScheduleDialog` instances at the end of the component:
- LinkedIn schedule dialog with `appId="linkedin-social"`
- X schedule dialog with `appId="xconsumerkeys-social"`

## Key Features

### 1. **Proper Account Detection**
- Checks if integration is installed via tRPC
- Finds the specific account from social accounts list
- Shows appropriate UI based on connection status

### 2. **Content Validation**
- LinkedIn: Checks if `outputs.linkedin` has content
- X: Checks if either `outputs.x` has content OR `xThreadItems` array has items
- Buttons are disabled if no content is available

### 3. **Visual Differentiation**
- LinkedIn uses blue/indigo gradient
- X uses sky/blue gradient
- Each section shows the connected account's information with avatar

### 4. **Schedule Dialog Integration**
- Uses the same `ScheduleDialog` component from the write screen
- Passes appropriate `appId` for each platform
- Handles date/time selection and plugin data (for auto-commenting)

### 5. **Error Handling**
- Shows toast notifications for errors (no account, no content)
- Validates content before allowing publish/schedule
- Validates date/time selection before scheduling

## TODO: Backend Integration

The frontend UI is complete. The following backend integrations need to be implemented:

1. **handleLinkedinPublish** - Implement actual LinkedIn posting API call
2. **handleLinkedinScheduleUpdate** - Implement LinkedIn post scheduling in database
3. **handleXPublish** - Implement actual X posting API call
4. **handleXScheduleUpdate** - Implement X post scheduling in database

## Usage Pattern

This implementation follows the same pattern as the write screen (`apps/web/pages/write/[id].tsx`):

1. User generates content for a platform
2. System detects if platform account is connected
3. User can click "Publish" for immediate posting or "Schedule" for scheduled posting
4. Schedule dialog allows date/time selection and optional plugin comments (for X)
5. Backend handles the actual API calls to social media platforms

## Testing Checklist

- [ ] LinkedIn account shows correctly when connected
- [ ] LinkedIn buttons work (Publish/Schedule)
- [ ] LinkedIn schedule dialog opens and closes properly
- [ ] X account shows correctly when connected
- [ ] X buttons work (Publish/Schedule)
- [ ] X schedule dialog opens and closes properly
- [ ] Install buttons work for both platforms
- [ ] Content validation works (buttons disabled when no content)
- [ ] Both dialogs can be opened independently without conflicts
- [ ] Date/time selection works in both dialogs
- [ ] Plugin comment feature works for X (auto-comment toggle)

## Related Files

- `apps/web/pages/write/[id].tsx` - Original implementation reference
- `apps/web/components/write/ScheduleDialog.tsx` - Schedule dialog component
- `apps/web/components/write/useWritePage.tsx` - Hook with schedule logic
- `packages/app-store/xconsumerkeyssocial/api/post.ts` - X posting API
- `packages/app-store/linkedinsocial/api/post.ts` - LinkedIn posting API
