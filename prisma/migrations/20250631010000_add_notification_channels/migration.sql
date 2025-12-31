-- Add missing notificationChannels column to EscalationRule table
-- This allows per-step notification channel configuration in escalation policies

ALTER TABLE "EscalationRule" 
ADD COLUMN IF NOT EXISTS "notificationChannels" "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[];
