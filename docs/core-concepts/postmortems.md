# Postmortems

Postmortems help teams learn from incidents and prevent recurrence.

## What is a Postmortem?

A postmortem is a structured review of an incident that documents:

- What happened
- Why it happened
- How it was resolved
- How to prevent recurrence

## Creating a Postmortem

1. Open a resolved incident
2. Click **Create Postmortem**
3. Fill in the template

## Postmortem Template

### Summary

Brief description of what happened.

### Timeline

Chronological sequence of events:

| Time  | Event                 |
| ----- | --------------------- |
| 14:00 | Alert triggered       |
| 14:05 | Engineer acknowledged |
| 14:15 | Root cause identified |
| 14:30 | Fix deployed          |
| 14:35 | Incident resolved     |

### Root Cause

Technical explanation of why the incident occurred.

### Impact

- Number of affected users
- Revenue impact (if applicable)
- Duration of outage

### Resolution

Steps taken to resolve the incident.

### Action Items

Preventive measures to implement:

- [ ] Add monitoring for X
- [ ] Update runbook for Y
- [ ] Implement circuit breaker

## Sharing Postmortems

### Internal

Share with the team via:

- Email notification
- Slack message
- Internal wiki

### Public

Optionally publish to status page for transparency.

> [!NOTE]
> Only publish public postmortems for major customer-facing incidents.

## Action Items Tracking

Track postmortem action items:

1. Go to **Action Items** in sidebar
2. View all open items
3. Assign owners
4. Track completion

## Blame-Free Culture

> [!IMPORTANT]
> Postmortems should focus on systems and processes, not individuals.

- Focus on **what** went wrong, not **who**
- Identify systemic issues
- Celebrate learning opportunities

## Best Practices

- ✅ Complete within 48 hours of resolution
- ✅ Involve all responders
- ✅ Be specific about root cause
- ✅ Create actionable follow-ups
- ✅ Review action items regularly
