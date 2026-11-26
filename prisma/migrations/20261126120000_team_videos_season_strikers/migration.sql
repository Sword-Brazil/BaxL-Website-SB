-- Vídeo por equipe Meta (geral e por temporada) e Striker do Causador de Dano por temporada.
ALTER TABLE "MetaTeam" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "MetaTeam" ADD COLUMN "seasonVideos" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "MetaTeamMember" ADD COLUMN "seasonStrikers" JSONB NOT NULL DEFAULT '{}';
