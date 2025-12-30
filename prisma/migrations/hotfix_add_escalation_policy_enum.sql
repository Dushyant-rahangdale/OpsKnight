-- Add ESCALATION_POLICY to AuditEntityType enum
-- This migration adds support for escalation policy audit logging

-- AlterEnum: Add new value to existing enum
ALTER TYPE "AuditEntityType" ADD VALUE IF NOT EXISTS 'ESCALATION_POLICY';
