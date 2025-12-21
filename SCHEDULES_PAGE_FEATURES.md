# Schedules Page Features Documentation

## Overview

The Schedules page has been completely refactored to match the app-wide design system and provide a comprehensive on-call schedule management interface. The page includes schedule listing, creation, layer management, override handling, and calendar visualization.

## Table of Contents

1. [Schedules List Page](#schedules-list-page)
2. [Schedule Detail Page](#schedule-detail-page)
3. [Components](#components)
4. [Server Actions](#server-actions)
5. [RBAC Integration](#rbac-integration)
6. [User Experience Features](#user-experience-features)
7. [Technical Implementation](#technical-implementation)

---

## Schedules List Page

### Location
`/schedules`

### Features

#### 1. **Header Section**
- **Eyebrow Text**: "On-call" label with accent styling
- **Page Title**: "Schedules" with descriptive subtitle
- **Coverage Status Pill**: 
  - Shows "Rotations active" (green) when schedules have active coverage
  - Shows "No active rotations" (red) when no active coverage
  - Color-coded with gradient backgrounds
- **New Schedule Button**: 
  - Enabled for Admin/Responder roles
  - Disabled with tooltip for User role
  - Links to create form section

#### 2. **Statistics Dashboard**
- **Schedule Count**: Total number of schedules
- **Layer Count**: Total number of layers across all schedules
- **Coverage Status**: 
  - "Healthy" (green) when active coverage exists
  - "Needs setup" (red) when no active coverage
- Displayed in glass panel cards with gradient backgrounds

#### 3. **Schedule Cards**
- **Card Design**:
  - Glass panel styling with gradient backgrounds
  - Hover effects (lift and shadow enhancement)
  - Border and rounded corners
- **Card Content**:
  - Schedule name (prominent heading)
  - Time zone badge (color-coded chip)
  - Description text
  - Metadata footer:
    - Layer count
    - Responder count (unique users)
    - "View schedule →" link
- **Empty State**:
  - Centered message with icon
  - Call-to-action button for creating first schedule
  - Only shown to users with create permissions

#### 4. **Create Schedule Form**
- **Location**: Sidebar panel
- **Fields**:
  - Schedule name (required)
  - Time zone selector (defaults to UTC)
- **Permissions**:
  - Fully functional for Admin/Responder roles
  - Disabled with warning message for User role
- **Features**:
  - Toast notifications on success/error
  - Form reset after successful creation
  - Auto-refresh of page data

---

## Schedule Detail Page

### Location
`/schedules/[id]`

### Features

#### 1. **Header Section**
- **Back Link**: Returns to schedules list
- **Schedule Name**: Large heading
- **Time Zone Info**: 
  - Current time in schedule timezone
  - Timezone label (e.g., "EST", "PST")
- **Coverage Status Pill**: 
  - "On-call active" (green) when someone is on-call
  - "No coverage" (red) when no active coverage

#### 2. **Layers Section**

##### Layer Management
- **Layer Cards**: 
  - Individual cards for each layer
  - Display layer name, rotation details, and timezone info
  - Edit and delete functionality
- **Layer Information**:
  - Layer name
  - Start time and timezone
  - Rotation length (hours)
  - End time (if specified)
- **Layer Actions**:
  - **Update Layer**: Edit name, rotation length, start/end times
  - **Delete Layer**: Confirmation dialog required
  - **Add Responders**: Add users to layer rotation
  - **Reorder Responders**: Move users up/down in rotation order
  - **Remove Responders**: Remove users from layer

##### Responder Management
- **Responder List**:
  - Shows all users in rotation order
  - Displays user names
  - Position controls (up/down arrows)
  - Remove button for each user
- **Add Responder Form**:
  - Dropdown of available users (excludes already-added users)
  - Add button with loading state
  - Toast notifications on success/error

##### Create Layer Form
- **Fields**:
  - Layer name (required)
  - Rotation length in hours (required, minimum 1)
  - Start date/time (required)
  - End date/time (optional)
- **Features**:
  - Pre-filled with current date/time
  - Validation for date ranges
  - Toast notifications
  - Auto-refresh after creation

#### 3. **Calendar View**
- **Schedule Calendar Component**:
  - Visual representation of schedule shifts
  - Shows layers and overrides
  - Timezone-aware display
  - Multi-month view (previous month, current month, next month)

#### 4. **Current Coverage Panel**
- **Active Blocks Display**:
  - Shows currently on-call users
  - User avatar (first initial)
  - User name
  - Layer name
  - Coverage end time
- **Next Change Indicator**:
  - Shows when the next rotation change will occur
  - Formatted in schedule timezone

#### 5. **Overrides Section**

##### Create Override Form
- **Fields**:
  - On-call user (required)
  - Replace user (optional - can replace specific user or any user)
  - Start date/time (required)
  - End date/time (required)
- **Features**:
  - Toast notifications
  - Validation for date ranges
  - Auto-refresh after creation
  - Permission-based access control

##### Upcoming Overrides
- **List Display**:
  - User name
  - Override time range
  - Replaced user (if specified)
  - Remove button (with confirmation)
- **Features**:
  - Sorted by start time
  - Limited to 6 upcoming overrides
  - Permission-based actions

##### Override History
- **List Display**:
  - User name
  - Historical time range
  - Replaced user (if applicable)
  - "Override" tag
- **Pagination**:
  - Page size: 8 overrides per page
  - Previous/Next navigation
  - Page indicator (e.g., "Page 1 of 3")
  - Sorted by end time (descending)

---

## Components

### 1. **ScheduleCard**
**Location**: `src/components/ScheduleCard.tsx`

**Purpose**: Displays individual schedule cards in the schedules list

**Props**:
- `schedule`: Schedule object with id, name, timeZone, and layers

**Features**:
- Glass panel styling
- Hover effects (CSS-based)
- Time zone badge
- Layer and responder counts
- Link to schedule detail page

**Styling**:
- Gradient background
- Border and shadow
- Responsive hover effects
- Consistent typography

---

### 2. **ScheduleStats**
**Location**: `src/components/ScheduleStats.tsx`

**Purpose**: Displays schedule statistics dashboard

**Props**:
- `scheduleCount`: Total number of schedules
- `layerCount`: Total number of layers
- `hasActiveCoverage`: Boolean indicating active coverage

**Features**:
- Three-column grid layout
- Glass panel cards
- Color-coded status indicators
- Large, readable numbers

---

### 3. **ScheduleCreateForm**
**Location**: `src/components/ScheduleCreateForm.tsx`

**Purpose**: Client component for creating new schedules

**Props**:
- `action`: Server action for creating schedule
- `canCreate`: Boolean for permission check

**Features**:
- `useActionState` hook for form state
- Toast notifications
- Form reset on success
- Auto-refresh page data
- Permission-based UI (disabled state for non-admins)

**State Management**:
- Form submission state
- Error handling
- Success feedback

---

### 4. **LayerCard**
**Location**: `src/components/LayerCard.tsx`

**Purpose**: Client component for managing individual layers

**Props**:
- `layer`: Layer object with id, name, dates, rotation length, and users
- `scheduleId`: Schedule ID
- `timeZone`: Schedule timezone
- `users`: Available users list
- `canManageSchedules`: Permission flag
- Action functions: `updateLayer`, `deleteLayer`, `addLayerUser`, `moveLayerUser`, `removeLayerUser`
- Format functions: `formatShortTime`, `formatDateInput`

**Features**:
- **Layer Information Display**:
  - Layer name and metadata
  - Rotation details
  - Timezone-aware time display
- **Edit Layer Form**:
  - Update name, rotation length, start/end times
  - Loading states during submission
  - Toast notifications
- **Responder Management**:
  - List of responders in rotation order
  - Add responder dropdown (excludes existing users)
  - Reorder controls (up/down arrows)
  - Remove responder buttons
- **Delete Confirmation**:
  - Confirmation dialog before deletion
  - Warning message about data loss
- **Permission Handling**:
  - Disabled UI for non-admins
  - Warning messages
  - Visual feedback (greyed-out elements)

**State Management**:
- `useTransition` for async operations
- `useState` for delete confirmation dialog
- Loading states for all actions

---

### 5. **LayerCreateForm**
**Location**: `src/components/LayerCreateForm.tsx`

**Purpose**: Client component for creating new layers

**Props**:
- `scheduleId`: Schedule ID
- `canManageSchedules`: Permission flag
- `createLayer`: Server action
- `formatDateInput`: Date formatting function
- `now`: Current date/time

**Features**:
- Form with validation
- Pre-filled start date (current time)
- Toast notifications
- Auto-refresh after creation
- Permission-based UI

---

### 6. **OverrideForm**
**Location**: `src/components/OverrideForm.tsx`

**Purpose**: Client component for creating overrides

**Props**:
- `scheduleId`: Schedule ID
- `users`: Available users list
- `canManageSchedules`: Permission flag
- `createOverride`: Server action

**Features**:
- User selection dropdown
- Optional "replace user" field
- Start/end date/time inputs
- Validation
- Toast notifications
- Permission-based UI

---

### 7. **OverrideList**
**Location**: `src/components/OverrideList.tsx`

**Purpose**: Client component for displaying override lists

**Props**:
- `overrides`: Array of override objects
- `scheduleId`: Schedule ID
- `canManageSchedules`: Permission flag
- `deleteOverride`: Server action
- `formatDateTime`: Date formatting function
- `title`: Section title
- `emptyMessage`: Message when no overrides

**Features**:
- List display with user names and time ranges
- Delete functionality with confirmation
- Empty state handling
- Permission-based actions
- Toast notifications

**State Management**:
- `useTransition` for async operations
- `useState` for delete confirmation dialog

---

## Server Actions

### Location
`src/app/(app)/schedules/actions.ts`

### Actions

#### 1. **createSchedule**
- **Purpose**: Create a new schedule
- **Permissions**: Admin or Responder
- **Parameters**: FormData (name, timeZone)
- **Returns**: `{ error?: string } | { success?: boolean }`
- **Features**:
  - Name validation
  - Timezone defaulting (UTC)
  - Error handling
  - Path revalidation

#### 2. **createLayer**
- **Purpose**: Create a new layer in a schedule
- **Permissions**: Admin or Responder
- **Parameters**: scheduleId, FormData (name, start, end, rotationLengthHours)
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Date validation
  - Rotation length validation
  - End date optional
  - Error messages for invalid data

#### 3. **updateLayer**
- **Purpose**: Update an existing layer
- **Permissions**: Admin or Responder
- **Parameters**: layerId, FormData
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Same validation as createLayer
  - Updates all layer properties
  - Error handling

#### 4. **deleteLayer**
- **Purpose**: Delete a layer and all its users
- **Permissions**: Admin or Responder
- **Parameters**: scheduleId, layerId
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Transaction-based deletion
  - Removes all layer users first
  - Error handling

#### 5. **addLayerUser**
- **Purpose**: Add a user to a layer
- **Permissions**: Admin or Responder
- **Parameters**: layerId, FormData (userId)
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Handles duplicate users (updates position)
  - Auto-calculates next position
  - Reorders positions after addition
  - Error handling

#### 6. **removeLayerUser**
- **Purpose**: Remove a user from a layer
- **Permissions**: Admin or Responder
- **Parameters**: layerId, userId
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Direct deletion by composite key
  - Error handling

#### 7. **moveLayerUser**
- **Purpose**: Reorder users in a layer
- **Permissions**: Admin or Responder
- **Parameters**: layerId, userId, direction ('up' | 'down')
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Boundary checking (can't move beyond first/last)
  - Transaction-based position swapping
  - Error handling

#### 8. **createOverride**
- **Purpose**: Create a schedule override
- **Permissions**: Admin or Responder
- **Parameters**: scheduleId, FormData (userId, replacesUserId, start, end)
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Date validation
  - Optional replace user
  - Error handling

#### 9. **deleteOverride**
- **Purpose**: Delete a schedule override
- **Permissions**: Admin or Responder
- **Parameters**: scheduleId, overrideId
- **Returns**: `{ error?: string } | undefined`
- **Features**:
  - Direct deletion
  - Error handling

---

## RBAC Integration

### Permission Levels

#### Admin
- Full access to all schedule operations
- Can create, update, and delete schedules
- Can manage all layers and overrides
- Can assign any user to layers

#### Responder
- Can create and manage schedules
- Can manage layers and overrides
- Can assign users to layers
- Same permissions as Admin for schedules

#### User
- Read-only access to schedules
- Cannot create schedules
- Cannot modify layers or overrides
- Can view schedule details and calendar

### Implementation

#### Server-Side Checks
- All server actions use `assertAdminOrResponder()`
- Returns error messages for unauthorized access
- Prevents unauthorized data modifications

#### Client-Side UI
- **Disabled Forms**: Greyed-out with reduced opacity
- **Warning Messages**: Clear indicators of permission requirements
- **Tooltips**: Explain why actions are disabled
- **Visual Feedback**: Consistent styling for disabled states

#### Permission Checks
- `getUserPermissions()`: Fetches user role and permissions
- `canManageSchedules`: Boolean flag for UI rendering
- Conditional rendering based on permissions

---

## User Experience Features

### 1. **Toast Notifications**
- **Success Messages**: 
  - "Schedule created successfully"
  - "Layer created successfully"
  - "Layer updated successfully"
  - "User added to layer"
  - "Override created successfully"
  - And more...
- **Error Messages**: 
  - Specific error messages from server actions
  - Validation errors
  - Permission errors
- **Implementation**: Uses `ToastProvider` context

### 2. **Confirmation Dialogs**
- **Delete Layer**: Confirmation required before deletion
- **Delete Override**: Confirmation required before deletion
- **Warning Messages**: Clear explanation of consequences
- **Implementation**: `ConfirmDialog` component

### 3. **Loading States**
- **Form Submissions**: Disabled buttons with "Creating..." / "Saving..." text
- **Async Operations**: `useTransition` hook for pending states
- **Visual Feedback**: Reduced opacity and cursor changes

### 4. **Empty States**
- **No Schedules**: Helpful message with call-to-action
- **No Layers**: Guidance to add first layer
- **No Responders**: Clear indication of empty layer
- **No Overrides**: Messages for upcoming and historical overrides

### 5. **Hover Effects**
- **Schedule Cards**: Lift and shadow enhancement on hover
- **CSS-Based**: No JavaScript event handlers
- **Smooth Transitions**: 0.2s ease transitions

### 6. **Responsive Design**
- **Grid Layouts**: Responsive columns
- **Flexible Cards**: Adapt to content
- **Mobile-Friendly**: Touch-friendly interactions

---

## Technical Implementation

### Architecture

#### Server Components
- **Schedules List Page**: Server component for data fetching
- **Schedule Detail Page**: Server component with parallel data fetching
- **Data Fetching**: Uses Prisma with optimized queries

#### Client Components
- **Interactive Forms**: All forms are client components
- **State Management**: React hooks (`useState`, `useTransition`, `useActionState`)
- **Navigation**: Next.js `useRouter` for programmatic navigation

### Data Fetching

#### Parallel Queries
- Uses `Promise.all()` for concurrent data fetching
- Optimized Prisma queries with selective fields
- Efficient includes for related data

#### Caching and Revalidation
- `revalidatePath()` after mutations
- Server-side data fetching
- Automatic cache invalidation

### Error Handling

#### Server Actions
- Try-catch blocks for all operations
- Specific error messages
- Type-safe error returns

#### Client Components
- Error state management
- Toast notifications for errors
- Graceful degradation

### Type Safety

#### TypeScript
- Strict type checking
- Proper prop types for all components
- Type-safe server actions

#### Prisma Types
- Generated types from schema
- Type-safe database queries
- Proper date handling

### Styling

#### CSS Approach
- Inline styles for component-specific styling
- Global CSS for reusable patterns
- CSS classes for hover effects
- Consistent design tokens

#### Design System
- Glass panel styling
- Gradient backgrounds
- Consistent spacing and typography
- Color-coded status indicators

---

## Future Enhancements

### Potential Improvements

1. **Search and Filtering**
   - Search schedules by name
   - Filter by timezone
   - Filter by coverage status

2. **Pagination**
   - Paginate schedules list for large datasets
   - Configurable page sizes

3. **Bulk Operations**
   - Bulk layer creation
   - Bulk user assignment

4. **Export Functionality**
   - Export schedule to calendar format (iCal)
   - PDF export of schedule

5. **Notifications**
   - Email notifications for schedule changes
   - Slack integration for on-call alerts

6. **Analytics**
   - Coverage metrics
   - Response time tracking
   - Schedule utilization

---

## Summary

The Schedules page provides a comprehensive on-call schedule management system with:

- ✅ **Complete CRUD operations** for schedules, layers, and overrides
- ✅ **Role-based access control** with proper permission checks
- ✅ **User-friendly interface** with toast notifications and confirmations
- ✅ **Reusable components** for maintainability
- ✅ **Type-safe implementation** with TypeScript
- ✅ **Consistent styling** matching app-wide design system
- ✅ **Error handling** with clear user feedback
- ✅ **Optimized performance** with parallel queries and caching

The implementation follows Next.js 16 best practices, uses Server and Client Components appropriately, and provides a seamless user experience for managing on-call schedules.




