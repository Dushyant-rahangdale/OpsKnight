# Timezone Implementation - Quick Reference

## Current Status Summary

### ✅ What's Working
- Database stores user timezone preference (`User.timeZone`)
- Schedule timezones are stored and used correctly
- Some components (LayerCard, WeekSummary, ScheduleDetailPage) use timezone correctly

### ❌ Critical Issues
- **50+ components** don't respect user timezone
- Incident timestamps show in browser timezone, not user preference
- No centralized timezone utility
- Inconsistent date formatting across the app

## Components Needing Updates

### High Priority (Incident Management)
- `IncidentCard.tsx` ❌
- `IncidentTable.tsx` ❌
- `IncidentsListTable.tsx` ❌
- `TimelineEvent.tsx` ❌
- `IncidentHeader.tsx` ❌
- `IncidentTimeline.tsx` ❌

### Medium Priority
- `UserTable.tsx` ❌
- `PostmortemCard.tsx` ❌
- `StatusPageIncidents.tsx` ❌
- Audit logs ❌
- Events page ❌

## Quick Fix Pattern

### Before (Incorrect)
```typescript
// ❌ Uses browser timezone
{new Date(incident.createdAt).toLocaleString()}
```

### After (Correct)
```typescript
// ✅ Uses user timezone
import { formatDateTime, getUserTimeZone } from '@/lib/timezone';

const timeZone = getUserTimeZone(user);
{formatDateTime(incident.createdAt, timeZone)}
```

## Implementation Checklist

- [ ] Create `src/lib/timezone.ts` utility
- [ ] Create `TimezoneContext` provider
- [ ] Update `TimeZoneSelect` component
- [ ] Update all incident components (6 files)
- [ ] Update user-facing components (5+ files)
- [ ] Test with multiple timezones
- [ ] Test DST transitions
- [ ] Update documentation

## Key Rules

1. **Store**: Always UTC in database ✅
2. **Display**: Convert to user timezone ❌ (needs implementation)
3. **Schedules**: Use schedule timezone ✅
4. **Incidents**: Use user timezone ❌ (needs implementation)

## See Full Analysis

See `TIMEZONE_IMPLEMENTATION_ANALYSIS.md` for complete details, code examples, and migration plan.

