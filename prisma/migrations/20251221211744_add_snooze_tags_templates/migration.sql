-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "snoozeReason" TEXT,
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTag" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT NOT NULL,
    "descriptionText" TEXT,
    "defaultUrgency" "IncidentUrgency" NOT NULL DEFAULT 'HIGH',
    "defaultPriority" TEXT,
    "defaultServiceId" TEXT,
    "createdById" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "IncidentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "IncidentTag_incidentId_idx" ON "IncidentTag"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentTag_tagId_idx" ON "IncidentTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentTag_incidentId_tagId_key" ON "IncidentTag"("incidentId", "tagId");

-- CreateIndex
CREATE INDEX "IncidentTemplate_createdById_idx" ON "IncidentTemplate"("createdById");

-- CreateIndex
CREATE INDEX "Incident_snoozedUntil_idx" ON "Incident"("snoozedUntil");

-- AddForeignKey
ALTER TABLE "IncidentTag" ADD CONSTRAINT "IncidentTag_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTag" ADD CONSTRAINT "IncidentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTemplate" ADD CONSTRAINT "IncidentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTemplate" ADD CONSTRAINT "IncidentTemplate_defaultServiceId_fkey" FOREIGN KEY ("defaultServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTemplate" ADD CONSTRAINT "IncidentTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
