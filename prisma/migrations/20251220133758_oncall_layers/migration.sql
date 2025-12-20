-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "targetAckMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "targetResolveMinutes" INTEGER NOT NULL DEFAULT 120;
