/*
  Warnings:

  - You are about to drop the column `rotation` on the `MetaTeam` table. All the data in the column will be lost.
  - You are about to drop the column `rotationNotes` on the `MetaTeam` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MetaTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaTeamId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT,
    "isDamageDealer" BOOLEAN NOT NULL DEFAULT false,
    "rotation" TEXT,
    "rotationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaTeamMember_metaTeamId_fkey" FOREIGN KEY ("metaTeamId") REFERENCES "MetaTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- A rotação que estava na equipe passa para o Líder, marcado como Causador de Dano.
INSERT INTO "new_MetaTeamMember" ("createdAt", "ctpId", "id", "metaTeamId", "slot", "uniformId", "updatedAt", "isDamageDealer", "rotation", "rotationNotes")
SELECT m."createdAt", m."ctpId", m."id", m."metaTeamId", m."slot", m."uniformId", m."updatedAt",
       t."rotation" IS NOT NULL, t."rotation", t."rotationNotes"
FROM "MetaTeamMember" m
LEFT JOIN "MetaTeam" t ON t."id" = m."metaTeamId" AND m."slot" = 'SOLO';
DROP TABLE "MetaTeamMember";
ALTER TABLE "new_MetaTeamMember" RENAME TO "MetaTeamMember";
CREATE UNIQUE INDEX "MetaTeamMember_metaTeamId_slot_key" ON "MetaTeamMember"("metaTeamId", "slot");
CREATE TABLE "new_MetaTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "battleDayId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaTeam_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MetaTeam_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MetaTeam" ("battleDayId", "createdAt", "id", "isPrimary", "label", "notes", "scope", "updatedAt", "updatedById") SELECT "battleDayId", "createdAt", "id", "isPrimary", "label", "notes", "scope", "updatedAt", "updatedById" FROM "MetaTeam";
DROP TABLE "MetaTeam";
ALTER TABLE "new_MetaTeam" RENAME TO "MetaTeam";
CREATE INDEX "MetaTeam_scope_battleDayId_idx" ON "MetaTeam"("scope", "battleDayId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
