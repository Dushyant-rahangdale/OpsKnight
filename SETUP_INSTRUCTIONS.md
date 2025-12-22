# Setup Instructions for New Features

## 🚀 Quick Start

### 1. Run Database Migration

The background job system uses PostgreSQL (no Redis needed!):
```bash
npx prisma migrate dev --name add_background_jobs
```

Or if using the migration file directly:
```bash
# The migration file is at: prisma/migrations/add_background_jobs/migration.sql
# Prisma will automatically apply it when you run:
npx prisma migrate dev
```

### 2. Environment Variables

Add to `.env.local`:
```env
# Cron Secret (for securing cron endpoints - optional)
CRON_SECRET=your-secret-key-here

# Notification Providers (when implementing)
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
```

### 3. Background Jobs are Ready!

The PostgreSQL-based job queue is already integrated:
- ✅ No Redis needed - uses your existing PostgreSQL database
- ✅ Jobs are automatically scheduled when escalations are created
- ✅ Cron endpoint processes jobs every 5 minutes (configured in vercel.json)
- ✅ Automatic retry with exponential backoff
- ✅ Job statistics and monitoring available

### 4. Verify Cron Job

The cron job is already configured in `vercel.json`:
- Runs every 5 minutes
- Endpoint: `/api/cron/process-escalations`

For local testing:
```bash
# Test the endpoint
curl http://localhost:3000/api/cron/process-escalations
```

### 6. Using New UI Components

Import and use:
```typescript
import { 
  Button, 
  Card, 
  Modal, 
  Select, 
  FormField,
  Checkbox,
  Badge,
  Skeleton,
  Spinner,
  ErrorBoundary,
  ErrorState
} from '@/components/ui';
```

Examples:
```tsx
// Button
<Button variant="primary" size="md" isLoading={loading}>
  Submit
</Button>

// Modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={<Button onClick={handleConfirm}>Confirm</Button>}
>
  Are you sure?
</Modal>

// Form
<FormField
  type="input"
  label="Email"
  inputType="email"
  required
  error={errors.email}
/>

// Loading
<LoadingWrapper isLoading={loading} skeleton="card">
  <YourContent />
</LoadingWrapper>
```

---

## 📋 Component Usage Checklist

- [ ] Replace inline button styles with `<Button>`
- [ ] Replace div containers with `<Card>`
- [ ] Add `<ErrorBoundary>` to route components
- [ ] Add skeleton loaders to Suspense fallbacks
- [ ] Use `<FormField>` for all form inputs
- [ ] Use `<Modal>` for dialogs
- [ ] Use `<Select>` for dropdowns
- [ ] Add loading states with `<Spinner>` or `<Skeleton>`

---

## 🔧 Next Steps

1. **Set up Redis** (if using background jobs)
2. **Install BullMQ** (if using background jobs)
3. **Test cron endpoint** locally
4. **Start using new components** in existing code
5. **Add more skeleton loaders** to other pages
6. **Implement notification providers** (SMS/Push)

---

**Last Updated:** December 2024

