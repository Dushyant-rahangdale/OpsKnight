-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);
