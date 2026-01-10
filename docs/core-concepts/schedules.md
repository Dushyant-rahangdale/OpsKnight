# On-Call Schedules

Schedules determine who is responsible for responding to incidents at any given time.

## What are Schedules?

Schedules define:

- **Who** is on-call
- **When** they're on-call
- **Rotations** for coverage
- **Overrides** for exceptions

## Creating a Schedule

1. Navigate to **Schedules** in the sidebar
2. Click **+ New Schedule**
3. Configure rotation settings

## Rotation Types

### Weekly Rotation

```
Week 1: Alice
Week 2: Bob
Week 3: Charlie
→ Repeat
```

### Daily Rotation

```
Mon: Alice
Tue: Bob
Wed: Charlie
Thu: Alice
...
```

### Custom Rotation

Define any pattern with specific start/end times.

## Schedule Layers

Complex schedules use multiple layers:

```
┌────────────────────────────────────────────┐
│  Layer 1: Primary On-Call (24x7)           │
├────────────────────────────────────────────┤
│  Layer 2: Business Hours Override          │
├────────────────────────────────────────────┤
│  Layer 3: Holiday Coverage                 │
└────────────────────────────────────────────┘
```

Higher layers take precedence over lower layers.

## Schedule Overrides

Temporary changes to the schedule:

1. Open the schedule
2. Click on the timeline
3. Select **Create Override**
4. Choose:
   - Who's covering
   - Start/end time
   - Reason

### Common Override Scenarios

- Vacation coverage
- Sick day replacement
- Meeting conflicts
- Training sessions

## Viewing Who's On-Call

### Current On-Call

The dashboard shows the current on-call person for each schedule.

### Future On-Call

View the schedule timeline to see upcoming rotations.

## Linking to Escalation Policies

Schedules are used in escalation policies:

1. Create an escalation policy
2. Add a step targeting the schedule
3. Assign the policy to services

See [Escalation Policies](./escalation-policies.md).

## Best Practices

- ✅ Ensure 24x7 coverage for critical services
- ✅ Use overrides for planned absences
- ✅ Rotate fairly among team members
- ✅ Consider timezone differences
- ✅ Define handoff procedures

## Schedule Timezone Behavior

Schedules are timezone-authoritative. Every date and time you see or enter on a schedule is interpreted in the schedule's timezone, not the viewer's browser timezone.

This affects:

- Calendar day grouping and "today" highlight: days are computed in the schedule timezone so shifts do not drift to adjacent days for remote viewers.
- Timeline ranges: 7-day and 14-day windows are built from the schedule timezone's day boundaries.
- Override presets: quick durations (e.g., 4h/8h) fill the form using the schedule timezone so they match manual inputs.
- Form submissions: date/time inputs keep their hidden values in sync with the displayed fields to avoid stale timezone data.

If you change a schedule's timezone, re-save layers and overrides so their intended local times stay accurate in the new timezone.
