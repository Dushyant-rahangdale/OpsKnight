-- CreateIndex
CREATE INDEX "Incident_nextEscalationAt_escalationStatus_idx" ON "Incident"("nextEscalationAt", "escalationStatus");
