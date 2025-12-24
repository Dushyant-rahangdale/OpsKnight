# Timezone Implementation Analysis - OpsGuard Incident Management System

## Executive Summary

This document analyzes the current timezone implementation in OpsGuard and provides recommendations for standardization across all components. Proper timezone handling is critical for incident management systems where accurate timestamps are essential for debugging, compliance, and coordination across global teams.

---

## Current Implementation

### 1. Database Schema

**User Model** (`prisma/schema.prisma`):
- `timeZone: String @default("UTC")` - User's preferred timezone
- Stored per user, defaults to UTC

**OnCallSchedule Model**:
- `timeZone: String @default("UTC")` - Schedule-specific timezone
- Used for on-call shift calculations and displays

### 2. Timezone Selection Components

#### `TimeZoneSelect.tsx`
- **Location**: `src/components/TimeZoneSelect.tsx`
- **Approach**: Uses `Intl.supportedValuesOf('timeZone')` with fallback list
- **Fallback Zones**: 12 common timezones (UTC, US, Europe, Asia, Australia)
- **Issue**: Only shows timezone identifier (e.g., "America/New_York"), not user-friendly labels

#### `PreferencesForm.tsx`
- **Location**: `src/components/settings/PreferencesForm.tsx`
- **Approach**: Hardcoded list of 12 timezones with labels
- **Example**: `'UTC (Coordinated Universal Time)'`, `'America/New_York (Eastern Time)'`
- **Issue**: Limited to 12 timezones, doesn't support all IANA timezones

### 3. Date Formatting Utilities

#### `date-format.ts`
- **Location**: `src/lib/date-format.ts`
- **Functions**:
  - `formatDate()` - Basic format, no timezone support
  - `formatDateFriendly()` - Uses UTC methods (not user timezone)
  - `formatTime()` - Uses local time (browser timezone)
  - `formatDateShort()` - Uses local time
  - `formatDateGroup()` - Uses local time
- **Critical Issue**: None of these functions accept or use user timezone parameter

### 4. Component-Level Date Formatting

#### Components Using Timezone Correctly ✅
1. **LayerCard.tsx** - Uses `Intl.DateTimeFormat` with `timeZone` parameter
2. **WeekSummary.tsx** - Uses `toLocaleTimeString` with `timeZone` parameter
3. **ScheduleDetailPage** - Uses `Intl.DateTimeFormat` with schedule timezone
4. **CurrentCoverageDisplay.tsx** - Uses `toLocaleString` with schedule timezone
5. **OverrideList.tsx** - Has `formatDateTime` function with timezone parameter

#### Components NOT Using Timezone ❌
1. **IncidentCard.tsx** - Uses `toLocaleTimeString()` without timezone
2. **TimelineEvent.tsx** - Uses `toLocaleTimeString()` without timezone
3. **IncidentTable.tsx** - Uses `toLocaleString()` without timezone
4. **IncidentHeader.tsx** - Uses `formatDateFriendly()` (UTC-based)
5. **IncidentsListTable.tsx** - Uses `formatDateFriendly()` (UTC-based)
6. **StatusPageIncidents.tsx** - Uses `toLocaleDateString()` without timezone
7. **PostmortemCard.tsx** - Uses `toLocaleDateString()` without timezone
8. **UserTable.tsx** - Uses `toLocaleString()` without timezone
9. **AuditLog** - Uses `toLocaleString()` without timezone
10. **Events Page** - Uses `toLocaleString()` without timezone

**Total**: ~50+ components with inconsistent timezone handling

---

## Critical Issues

### 1. **Inconsistent Timezone Display**
- Some components show times in user's browser timezone
- Some components show times in UTC
- Some components show times in schedule timezone
- **Impact**: Users see different times for the same incident across different pages

### 2. **No Centralized Timezone Utility**
- Each component implements its own date formatting
- No single source of truth for timezone-aware formatting
- Difficult to maintain and update

### 3. **User Timezone Not Applied to Incidents**
- User has `timeZone` preference stored in database
- But incident timestamps don't respect this preference
- **Critical for incident management**: Users need to see incident times in their local timezone

### 4. **UTC vs Local Time Confusion**
- `formatDateFriendly()` uses UTC methods but doesn't convert to user timezone
- Components mix UTC and local time formatting
- No clear pattern for when to use which

### 5. **Limited Timezone Support**
- `PreferencesForm` only supports 12 timezones
- `TimeZoneSelect` supports all IANA timezones but shows raw identifiers
- No timezone search/filter functionality

### 6. **SSR/Client Hydration Issues**
- Some formatting functions use local time which can cause hydration mismatches
- `formatDateFriendly()` uses UTC to avoid this, but doesn't support timezone conversion

### 7. **Schedule vs User Timezone Confusion**
- Schedules have their own timezone
- Users have their own timezone
- No clear rule for which to use when

---

## Recommendations

### 1. Create Centralized Timezone Utility

**File**: `src/lib/timezone.ts`

```typescript
/**
 * Centralized timezone utilities for consistent date/time formatting
 * across all components in the incident management system
 */

import { User } from '@prisma/client';

/**
 * Get user's timezone preference, fallback to UTC
 */
export function getUserTimeZone(user?: { timeZone?: string | null }): string {
    return user?.timeZone || 'UTC';
}

/**
 * Format date/time in user's timezone
 * SSR-safe: Returns consistent format for server and client
 */
export function formatDateTime(
    date: Date | string,
    timeZone: string,
    options?: {
        format?: 'date' | 'time' | 'datetime' | 'relative';
        includeTimeZone?: boolean;
    }
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    const { format = 'datetime', includeTimeZone = false } = options || {};

    switch (format) {
        case 'date':
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone
            }).format(d);
        
        case 'time':
            return new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone
            }).format(d);
        
        case 'datetime':
        default:
            const formatted = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone
            }).format(d);
            
            if (includeTimeZone) {
                const tzName = new Intl.DateTimeFormat('en-US', {
                    timeZone,
                    timeZoneName: 'short'
                }).format(d);
                return `${formatted} ${tzName}`;
            }
            
            return formatted;
        
        case 'relative':
            return formatRelativeTime(d, timeZone);
    }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
function formatRelativeTime(date: Date, timeZone: string): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
        return diffSeconds < 0 ? 'just now' : 'in a few seconds';
    }
    
    if (Math.abs(diffMinutes) < 60) {
        return diffMinutes < 0 
            ? `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`
            : `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    if (Math.abs(diffHours) < 24) {
        return diffHours < 0
            ? `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`
            : `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    
    if (Math.abs(diffDays) < 7) {
        return diffDays < 0
            ? `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`
            : `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    // For longer periods, show actual date
    return formatDateTime(date, timeZone, { format: 'datetime' });
}

/**
 * Get timezone label (e.g., "America/New_York" -> "Eastern Time (ET)")
 */
export function getTimeZoneLabel(timeZone: string): string {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'long'
        });
        const parts = formatter.formatToParts(new Date());
        const tzName = parts.find(p => p.type === 'timeZoneName')?.value || timeZone;
        
        // Add abbreviation
        const shortFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'short'
        });
        const shortParts = shortFormatter.formatToParts(new Date());
        const tzAbbr = shortParts.find(p => p.type === 'timeZoneName')?.value || '';
        
        return tzAbbr ? `${tzName} (${tzAbbr})` : tzName;
    } catch {
        return timeZone;
    }
}

/**
 * Get all supported timezones with labels
 */
export function getAllTimeZones(): Array<{ value: string; label: string }> {
    try {
        if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
            const zones = Intl.supportedValuesOf('timeZone');
            return zones.map(zone => ({
                value: zone,
                label: getTimeZoneLabel(zone)
            })).sort((a, b) => a.label.localeCompare(b.label));
        }
    } catch {
        // Fallback if Intl.supportedValuesOf is not available
    }
    
    // Fallback list
    return [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
        { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
        { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
        { value: 'Europe/London', label: 'Europe/London (GMT)' },
        { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' }
    ];
}

/**
 * Validate timezone string
 */
export function isValidTimeZone(timeZone: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone });
        return true;
    } catch {
        return false;
    }
}
```

### 2. Create Timezone Context Provider

**File**: `src/contexts/TimezoneContext.tsx`

```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';

type TimezoneContextType = {
    userTimeZone: string;
    setUserTimeZone: (tz: string) => void;
};

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ 
    children, 
    initialTimeZone = 'UTC' 
}: { 
    children: ReactNode; 
    initialTimeZone?: string;
}) {
    const [userTimeZone, setUserTimeZone] = useState(initialTimeZone);

    return (
        <TimezoneContext.Provider value={{ userTimeZone, setUserTimeZone }}>
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);
    if (!context) {
        throw new Error('useTimezone must be used within TimezoneProvider');
    }
    return context;
}
```

### 3. Standardize Timezone Selection Component

**Update**: `src/components/TimeZoneSelect.tsx`

- Use centralized `getAllTimeZones()` function
- Show user-friendly labels
- Add search/filter capability for long lists
- Group by region (optional enhancement)

### 4. Update All Date Formatting

**Priority Order**:

1. **High Priority** (Incident-related):
   - `IncidentCard.tsx`
   - `IncidentTable.tsx`
   - `IncidentsListTable.tsx`
   - `TimelineEvent.tsx`
   - `IncidentHeader.tsx`
   - `IncidentTimeline.tsx`

2. **Medium Priority** (User-facing):
   - `UserTable.tsx`
   - `PostmortemCard.tsx`
   - `StatusPageIncidents.tsx`
   - Audit logs
   - Events page

3. **Low Priority** (Internal):
   - Analytics pages
   - Dashboard components

### 5. Server-Side Timezone Handling

**Pattern for Server Components**:

```typescript
// In server component
import { getUserTimeZone, formatDateTime } from '@/lib/timezone';

export default async function IncidentPage({ params }) {
    const user = await getCurrentUser();
    const timeZone = getUserTimeZone(user);
    
    const incident = await getIncident(params.id);
    
    return (
        <div>
            Created: {formatDateTime(incident.createdAt, timeZone)}
        </div>
    );
}
```

### 6. Client-Side Timezone Handling

**Pattern for Client Components**:

```typescript
'use client';

import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';

export default function IncidentCard({ incident }) {
    const { userTimeZone } = useTimezone();
    
    return (
        <div>
            Created: {formatDateTime(incident.createdAt, userTimeZone)}
        </div>
    );
}
```

### 7. Schedule Timezone vs User Timezone

**Rule**:
- **Schedule-related displays**: Use schedule timezone (e.g., on-call shifts, coverage)
- **Incident timestamps**: Use user timezone (e.g., when incident was created)
- **Cross-references**: Show both if needed (e.g., "Created at 2:00 PM EST (your timezone: 11:00 AM PST)")

---

## Migration Plan

### Phase 1: Foundation (Week 1)
1. ✅ Create `src/lib/timezone.ts` utility
2. ✅ Create `TimezoneContext` provider
3. ✅ Update `TimeZoneSelect` component
4. ✅ Update `PreferencesForm` to use new utility

### Phase 2: Critical Components (Week 2)
1. ✅ Update all incident-related components
2. ✅ Update timeline components
3. ✅ Update incident tables and lists
4. ✅ Test with multiple timezones

### Phase 3: Secondary Components (Week 3)
1. ✅ Update user-facing components
2. ✅ Update audit logs
3. ✅ Update events page
4. ✅ Update status pages

### Phase 4: Polish & Testing (Week 4)
1. ✅ Add timezone indicators where needed
2. ✅ Test edge cases (DST transitions, etc.)
3. ✅ Update documentation
4. ✅ Performance testing

---

## Best Practices for Incident Management Systems

### 1. **Always Store in UTC**
- ✅ Database already stores `DateTime` in UTC (Prisma default)
- ✅ API responses should use UTC ISO strings
- ✅ Never store local time in database

### 2. **Convert to User Timezone for Display**
- ✅ Always convert UTC to user's preferred timezone for display
- ✅ Use IANA timezone identifiers (e.g., "America/New_York")
- ✅ Never use offset-based timezones (e.g., "GMT-5")

### 3. **Show Timezone Indicator**
- ✅ Include timezone abbreviation (e.g., "EST", "PST") when context is unclear
- ✅ Show "your timezone" label in user preferences
- ✅ For schedules, show schedule timezone clearly

### 4. **Handle DST Transitions**
- ✅ Use IANA timezones (they handle DST automatically)
- ✅ Test with dates during DST transitions
- ✅ Never manually calculate DST offsets

### 5. **Relative Time for Recent Events**
- ✅ Show relative time for events < 24 hours old ("2 hours ago")
- ✅ Show absolute time for older events
- ✅ Update relative times in real-time (client-side)

### 6. **Consistency Across Views**
- ✅ Same incident should show same time across all views
- ✅ Use same formatting function everywhere
- ✅ Centralize timezone logic

---

## Testing Checklist

- [ ] Test with different user timezones (UTC, EST, PST, IST, JST, etc.)
- [ ] Test DST transitions (spring forward, fall back)
- [ ] Test with schedule timezones different from user timezones
- [ ] Test SSR/client hydration (no mismatches)
- [ ] Test with invalid timezone strings (fallback to UTC)
- [ ] Test relative time formatting
- [ ] Test timezone selection component with all IANA timezones
- [ ] Test performance with large lists of incidents
- [ ] Test timezone changes (user updates preference)
- [ ] Test edge cases (midnight, year boundaries, etc.)

---

## Conclusion

The current timezone implementation has significant inconsistencies that need to be addressed for a production-ready incident management system. The recommended approach:

1. **Centralize** timezone logic in a utility library
2. **Standardize** date formatting across all components
3. **Respect** user timezone preferences for all incident timestamps
4. **Support** all IANA timezones, not just a limited set
5. **Test** thoroughly with multiple timezones and DST transitions

This will ensure accurate, consistent time displays critical for incident management, debugging, and compliance.

---

## Next Steps

1. Review this analysis with the team
2. Prioritize components based on usage
3. Create implementation tickets
4. Begin Phase 1 implementation
5. Set up timezone testing environment

