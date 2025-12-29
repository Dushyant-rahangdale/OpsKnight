-- CreateTable
CREATE TABLE IF NOT EXISTS "OidcConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "issuer" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "autoProvision" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OidcConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OidcConfig" ADD CONSTRAINT "OidcConfig_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
