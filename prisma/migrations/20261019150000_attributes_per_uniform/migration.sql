-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Uniform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "side" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "species" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "attackType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Uniform_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Atributos passam a ser do traje: o que o traje não tinha vem do personagem.
INSERT INTO "new_Uniform" ("active", "agentId", "attackType", "createdAt", "gender", "id", "imagePath", "name", "side", "slug", "species", "updatedAt")
SELECT u."active", u."agentId",
       coalesce(u."attackType", a."attackType", 'UNKNOWN'), u."createdAt",
       coalesce(u."gender", a."gender", 'UNKNOWN'), u."id", u."imagePath", u."name",
       coalesce(u."side", a."side", 'UNKNOWN'), u."slug",
       coalesce(u."species", a."species", 'UNKNOWN'), u."updatedAt"
FROM "Uniform" u JOIN "Agent" a ON a."id" = u."agentId";
DROP TABLE "Uniform";
ALTER TABLE "new_Uniform" RENAME TO "Uniform";
CREATE UNIQUE INDEX "Uniform_agentId_slug_key" ON "Uniform"("agentId", "slug");
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Agent" ("active", "createdAt", "id", "name", "slug", "updatedAt") SELECT "active", "createdAt", "id", "name", "slug", "updatedAt" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

