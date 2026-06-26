# Pillar Management

## Overview

The Ideas & Pillars feature now includes a comprehensive pillar management system with soft delete support.

## Features

### 1. Initialize Default Pillars
- **Default Pillars**: Build in Public, Founder Lessons, Client Wins, Playbooks
- **Colors**: Each pillar has a distinct color (indigo, cyan, green, orange)
- **One-click initialization**: Click "Init Default Pillars" button to create all 4 pillars at once

### 2. Add Custom Pillars
- **Custom names**: Create pillars with any name (max 100 characters)
- **Color picker**: Choose from 8 predefined colors:
  - Indigo
  - Cyan
  - Green
  - Orange
  - Purple
  - Pink
  - Red
  - Blue

### 3. Soft Delete
- **Non-destructive**: Deleted pillars are marked with `deletedAt` timestamp
- **Data preservation**: Ideas associated with deleted pillars are preserved
- **Recovery**: Soft-deleted pillars can be recovered from the database if needed

## Usage

### Initialize Default Pillars

```typescript
// In your component or API
const initMutation = trpc.viewer.ideasPillars.initPillars.useMutation();
initMutation.mutate(); // Creates all 4 default pillars
```

### Create a Custom Pillar

```typescript
const createMutation = trpc.viewer.ideasPillars.createPillar.useMutation();
createMutation.mutate({
  name: "Marketing Tips",
  color: "bg-purple-600"
});
```

### Delete a Pillar (Soft Delete)

```typescript
const deleteMutation = trpc.viewer.ideasPillars.deletePillar.useMutation();
deleteMutation.mutate({ id: pillarId });
```

## UI Components

### PillarManager Component

Located at: `apps/web/components/ideas-pillars/PillarManager.tsx`

**Features**:
- Lists all active pillars
- Shows idea count for each pillar
- "Init Default Pillars" button (only shown when no pillars exist)
- "Add Pillar" dialog with name input and color picker
- Delete button for each pillar (with confirmation)
- Loading states for all mutations

**Usage**:
```tsx
import { PillarManager } from "@components/ideas-pillars";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <PillarManager onPillarChange={() => {
      // Called after any pillar is created, deleted, or updated
      utils.viewer.ideasPillars.listPillars.invalidate();
    }} />
  </DialogContent>
</Dialog>
```

### Pillar Tabs in Ideas Page

Located at: `apps/web/pages/ideas-pillars.tsx`

**Features**:
- Displays all active pillars as colored tabs
- Shows idea count for each pillar
- "Manage" button to open PillarManager dialog
- Empty state with "Manage Pillars" CTA when no pillars exist

## Database Schema

```prisma
model Pillar {
  id        String    @id @default(cuid())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  color     String    @default("bg-indigo-600")
  order     Int       @default(0)
  deletedAt DateTime? // Soft delete timestamp
  ideas     Idea[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([userId, name])
  @@index([userId])
  @@index([userId, deletedAt])
}
```

## API Endpoints

### `ideasPillars.initPillars`
- **Type**: Mutation
- **Auth**: Required
- **Returns**: `{ created: number, pillars: Pillar[] }`
- **Purpose**: Creates the 4 default pillars if they don't exist

### `ideasPillars.listPillars`
- **Type**: Query
- **Auth**: Required
- **Returns**: `Pillar[]` (only non-deleted pillars)
- **Includes**: Idea count via `_count.ideas`

### `ideasPillars.createPillar`
- **Type**: Mutation
- **Auth**: Required
- **Input**: `{ name: string, color?: string }`
- **Returns**: `Pillar`
- **Validation**: Name must be unique per user

### `ideasPillars.deletePillar`
- **Type**: Mutation
- **Auth**: Required
- **Input**: `{ id: string }`
- **Returns**: `{ success: boolean }`
- **Action**: Sets `deletedAt` timestamp (soft delete)

## Error Handling

All mutations include proper error handling with user-friendly toast messages:

- **Creation errors**: "Failed to create pillar" or specific error message
- **Deletion errors**: "Failed to delete pillar" or specific error message
- **Validation errors**: "Please enter a pillar name"
- **Conflict errors**: "A pillar with this name already exists"

## Best Practices

1. **Always use soft delete**: Never hard delete pillars to preserve data integrity
2. **Unique names**: Pillar names must be unique per user
3. **Color consistency**: Use the predefined Tailwind color classes for consistency
4. **Loading states**: Always show loading indicators during mutations
5. **Confirmation dialogs**: Always confirm before deleting a pillar

## Future Enhancements

- [ ] Drag-and-drop reordering of pillars
- [ ] Edit pillar name and color
- [ ] Restore soft-deleted pillars
- [ ] Archive/unarchive functionality
- [ ] Pillar templates
- [ ] Bulk operations
