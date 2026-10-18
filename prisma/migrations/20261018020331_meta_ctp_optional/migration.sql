-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MetaTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaTeamId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaTeamMember_metaTeamId_fkey" FOREIGN KEY ("metaTeamId") REFERENCES "MetaTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MetaTeamMember" ("createdAt", "ctpId", "id", "metaTeamId", "slot", "uniformId", "updatedAt") SELECT "createdAt", "ctpId", "id", "metaTeamId", "slot", "uniformId", "updatedAt" FROM "MetaTeamMember";
DROP TABLE "MetaTeamMember";
ALTER TABLE "new_MetaTeamMember" RENAME TO "MetaTeamMember";
CREATE UNIQUE INDEX "MetaTeamMember_metaTeamId_slot_key" ON "MetaTeamMember"("metaTeamId", "slot");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
