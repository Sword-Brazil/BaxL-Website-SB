-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Uniform" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "side" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "species" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "attackType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Uniform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ctp" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ctp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cycleAnchor" TIMESTAMP(3) NOT NULL,
    "dayTurnoverHour" INTEGER NOT NULL DEFAULT 12,
    "weeklyResetHour" INTEGER NOT NULL DEFAULT 22,
    "baiWeekday" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleDay" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictionCriterion" (
    "id" TEXT NOT NULL,
    "battleDayId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestrictionCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTeam" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "battleDayId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTeamMember" (
    "id" TEXT NOT NULL,
    "metaTeamId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT,
    "isDamageDealer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rotation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "uniformId" TEXT,
    "position" INTEGER NOT NULL,
    "title" TEXT,
    "sequence" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityEntry" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "battleDayId" TEXT,
    "role" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "uniformId" TEXT NOT NULL,
    "ctpId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaiBoss" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT,
    "tips" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaiBoss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSelectionsDoc" (
    "userId" TEXT NOT NULL,
    "json" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSelectionsDoc_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "firstFailAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SecurityNotice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "params" TEXT,
    "originSessionId" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityNotice_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Rotation_agentId_position_idx" ON "Rotation"("agentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityEntry_scope_battleDayId_role_rank_key" ON "PriorityEntry"("scope", "battleDayId", "role", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "BaiBoss_position_key" ON "BaiBoss"("position");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SecurityNotice_userId_dismissedAt_idx" ON "SecurityNotice"("userId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "Uniform" ADD CONSTRAINT "Uniform_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestrictionCriterion" ADD CONSTRAINT "RestrictionCriterion_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTeam" ADD CONSTRAINT "MetaTeam_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTeam" ADD CONSTRAINT "MetaTeam_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTeamMember" ADD CONSTRAINT "MetaTeamMember_metaTeamId_fkey" FOREIGN KEY ("metaTeamId") REFERENCES "MetaTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTeamMember" ADD CONSTRAINT "MetaTeamMember_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTeamMember" ADD CONSTRAINT "MetaTeamMember_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rotation" ADD CONSTRAINT "Rotation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rotation" ADD CONSTRAINT "Rotation_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityEntry" ADD CONSTRAINT "PriorityEntry_battleDayId_fkey" FOREIGN KEY ("battleDayId") REFERENCES "BattleDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityEntry" ADD CONSTRAINT "PriorityEntry_uniformId_fkey" FOREIGN KEY ("uniformId") REFERENCES "Uniform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityEntry" ADD CONSTRAINT "PriorityEntry_ctpId_fkey" FOREIGN KEY ("ctpId") REFERENCES "Ctp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectionsDoc" ADD CONSTRAINT "UserSelectionsDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityNotice" ADD CONSTRAINT "SecurityNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Segurança: o Supabase expõe o schema public pela Data API (PostgREST). RLS ligado e sem
-- policies = nenhum acesso por ela; o app usa só o Prisma, com o dono das tabelas (ignora RLS).
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Uniform" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ctp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RestrictionCriterion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetaTeam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetaTeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriorityEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BaiBoss" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSelectionsDoc" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityNotice" ENABLE ROW LEVEL SECURITY;
