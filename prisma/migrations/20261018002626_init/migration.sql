-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "attackType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Uniform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Uniform_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ctp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "cycleAnchor" DATETIME NOT NULL,
    "dayTurnoverHour" INTEGER NOT NULL DEFAULT 12,
    "weeklyResetHour" INTEGER NOT NULL DEFAULT 22,
    "baiWeekday" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BattleDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RestrictionCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleDayId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RestrictionCriterion_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaTeam" (
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

-- CreateTable
CREATE TABLE "MetaTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaTeamId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaTeamMember_metaTeamId_fkey" FOREIGN KEY ("metaTeamId") REFERENCES "MetaTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MetaTeamMember_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriorityEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "battleDayId" TEXT,
    "role" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PriorityEntry_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PriorityEntry_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PriorityEntry_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BaiBoss" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT,
    "tips" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "firstFailAt" DATETIME,
    "lockedUntil" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSelectionsDoc" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "json" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSelectionsDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Uniform_agentId_slug_key" ON "Uniform"("agentId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ctp_type_quality_key" ON "Ctp"("type", "quality");

-- CreateIndex
CREATE UNIQUE INDEX "BattleDay_mode_number_key" ON "BattleDay"("mode", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RestrictionCriterion_battleDayId_attribute_key" ON "RestrictionCriterion"("battleDayId", "attribute");

-- CreateIndex
CREATE INDEX "MetaTeam_scope_battleDayId_idx" ON "MetaTeam"("scope", "battleDayId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaTeamMember_metaTeamId_slot_key" ON "MetaTeamMember"("metaTeamId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityEntry_scope_battleDayId_role_rank_key" ON "PriorityEntry"("scope", "battleDayId", "role", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "BaiBoss_position_key" ON "BaiBoss"("position");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
