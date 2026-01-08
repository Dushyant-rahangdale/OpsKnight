# Escalation Policies

Escalation policies define how incidents are routed and escalated through your organization.

## What is an Escalation Policy?

An escalation policy is a set of rules that determine:

- **Who** gets notified when an incident occurs
- **When** to escalate if there's no response
- **How** many times to try before escalating

## Creating an Escalation Policy

1. Navigate to **Escalation Policies** in the sidebar
2. Click **+ New Policy**
3. Add escalation steps

## Escalation Steps

Each step defines a notification target and timeout:

```
┌─────────────────────────────────────────────┐
│ Step 1: Notify Primary On-Call Schedule     │
│         Wait: 5 minutes                     │
├─────────────────────────────────────────────┤
│ Step 2: Notify Secondary On-Call Schedule   │
│         Wait: 10 minutes                    │
├─────────────────────────────────────────────┤
│ Step 3: Notify Team Lead (User)             │
│         Wait: 15 minutes                    │
├─────────────────────────────────────────────┤
│ Step 4: Notify Engineering Manager          │
│         Final step - repeat                 │
└─────────────────────────────────────────────┘
```

## Target Types

| Target       | Description            |
| ------------ | ---------------------- |
| **User**     | Specific person        |
| **Team**     | All team members       |
| **Schedule** | Current on-call person |

## Configuration Options

### Delay Between Steps

How long to wait before escalating:

- 0 minutes = Immediate
- 5-30 minutes = Typical
- Custom values supported

### Repeat Behavior

If all steps complete without acknowledgment:

- **Repeat** - Start over from step 1
- **Stop** - No more notifications

## Example Policies

### Simple (Small Team)

```
Step 1: On-Call Schedule → 10 min → Repeat
```

### Standard (Medium Team)

```
Step 1: On-Call Schedule → 5 min
Step 2: Secondary Schedule → 10 min
Step 3: Team Lead → 15 min → Repeat
```

### Enterprise (Critical Services)

```
Step 1: On-Call Schedule → 5 min
Step 2: Secondary Schedule → 5 min
Step 3: Team → 10 min
Step 4: Engineering Manager → 15 min
Step 5: VP of Engineering → Repeat
```

## Assigning to Services

1. Open the service
2. Go to **Settings**
3. Select the **Escalation Policy**
4. Save

## Best Practices

- ✅ Always have a fallback step
- ✅ Keep initial delays short (5-10 min)
- ✅ Include manager escalation for critical services
- ✅ Test policies with non-critical alerts
- ✅ Document expected response times
