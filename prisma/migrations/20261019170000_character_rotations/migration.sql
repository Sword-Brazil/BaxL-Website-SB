-- CreateTable
CREATE TABLE "Rotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "uniformId" TEXT,
    "position" INTEGER NOT NULL,
    "title" TEXT,
    "sequence" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rotation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rotation_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- As rotações cadastradas nas equipes passam a ser do traje (uma por traje, sem repetir texto).
INSERT INTO "Rotation" ("id", "agentId", "uniformId", "position", "sequence", "description", "videoUrl", "createdAt", "updatedAt")
SELECT 'mg' || lower(hex(randomblob(12))), u."agentId", m."uniformId",
       ROW_NUMBER() OVER (PARTITION BY u."agentId" ORDER BY m."createdAt") - 1,
       m."rotation", m."rotationNotes", m."rotationVideoUrl", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT "uniformId", "rotation", MIN("rotationNotes") AS "rotationNotes", MIN("rotationVideoUrl") AS "rotationVideoUrl", MIN("createdAt") AS "createdAt"
  FROM "MetaTeamMember" WHERE "isDamageDealer" = 1 AND "rotation" IS NOT NULL
  GROUP BY "uniformId", "rotation"
) m JOIN "Uniform" u ON u."id" = m."uniformId";

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaTeamMember_metaTeamId_fkey" FOREIGN KEY ("metaTeamId") REFERENCES "MetaTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MetaTeamMember" ("createdAt", "ctpId", "id", "isDamageDealer", "metaTeamId", "slot", "uniformId", "updatedAt") SELECT "createdAt", "ctpId", "id", "isDamageDealer", "metaTeamId", "slot", "uniformId", "updatedAt" FROM "MetaTeamMember";
DROP TABLE "MetaTeamMember";
ALTER TABLE "new_MetaTeamMember" RENAME TO "MetaTeamMember";
CREATE UNIQUE INDEX "MetaTeamMember_metaTeamId_slot_key" ON "MetaTeamMember"("metaTeamId", "slot");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Rotation_agentId_position_idx" ON "Rotation"("agentId", "position");

