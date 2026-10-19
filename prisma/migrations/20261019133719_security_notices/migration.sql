-- CreateTable
CREATE TABLE "SecurityNotice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "params" TEXT,
    "originSessionId" TEXT,
    "dismissedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecurityNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SecurityNotice_userId_dismissedAt_idx" ON "SecurityNotice"("userId", "dismissedAt");

-- Contas já existentes com e-mail não confirmado recebem o aviso persistente.
INSERT INTO "SecurityNotice" ("id", "userId", "type", "createdAt", "updatedAt")
SELECT 'bf' || lower(hex(randomblob(12))), "id", 'EMAIL_UNVERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" WHERE "emailVerifiedAt" IS NULL;
