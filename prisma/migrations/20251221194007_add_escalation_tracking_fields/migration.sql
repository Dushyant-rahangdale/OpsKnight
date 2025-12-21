-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "currentEscalationStep" INTEGER,
ADD COLUMN     "escalationStatus" TEXT,
ADD COLUMN     "nextEscalationAt" TIMESTAMP(3);
