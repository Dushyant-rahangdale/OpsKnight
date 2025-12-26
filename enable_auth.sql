UPDATE "StatusPage" SET "requireAuth" = true WHERE id = (SELECT id FROM "StatusPage" LIMIT 1);
