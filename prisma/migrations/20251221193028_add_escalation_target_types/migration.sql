-- CreateEnum
CREATE TYPE "EscalationTargetType" AS ENUM ('USER', 'TEAM', 'SCHEDULE');

-- DropForeignKey
ALTER TABLE "EscalationRule" DROP CONSTRAINT "EscalationRule_targetUserId_fkey";

-- AlterTable
ALTER TABLE "EscalationRule" ADD COLUMN     "targetScheduleId" TEXT,
ADD COLUMN     "targetTeamId" TEXT,
ADD COLUMN     "targetType" "EscalationTargetType" NOT NULL DEFAULT 'USER',
ALTER COLUMN "targetUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "EscalationRule" ADD CONSTRAINT "EscalationRule_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationRule" ADD CONSTRAINT "EscalationRule_targetTeamId_fkey" FOREIGN KEY ("targetTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationRule" ADD CONSTRAINT "EscalationRule_targetScheduleId_fkey" FOREIGN KEY ("targetScheduleId") REFERENCES "OnCallSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
