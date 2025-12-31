-- AlterTable: Add notificationChannels to EscalationRule
-- This field stores per-step notification channel preferences

ALTER TABLE "EscalationRule" ADD COLUMN IF NOT EXISTS "notificationChannels" "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[];
