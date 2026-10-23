-- Modos em que o personagem pontua (automático pelas equipes Meta, ou escolhidos pelo admin) e
-- um vídeo de demonstração da rotação em cada modo, além do vídeo geral.
ALTER TABLE "Agent" ADD COLUMN "scoringAuto" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "scoringModes" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Rotation" ADD COLUMN "videoBax" TEXT,
ADD COLUMN "videoBal" TEXT,
ADD COLUMN "videoBai" TEXT;
