-- Temporadas unificadas: o jogo tem só 3 pares (BAX e BAL), Paralisia e Choque, Silêncio e
-- Armadilha, Queimadura e Fratura. A temporada salva passa a ser o par (pelo efeito da BAX).
ALTER TABLE "Settings" ADD COLUMN "season" TEXT NOT NULL DEFAULT 'PARALYSIS_SHOCK';
UPDATE "Settings" SET "season" = CASE "baxEffect"
  WHEN 'SILENCE' THEN 'SILENCE_TRAP'
  WHEN 'BURN' THEN 'BURN_FRACTURE'
  ELSE 'PARALYSIS_SHOCK'
END;
ALTER TABLE "Settings" DROP COLUMN "baxEffect", DROP COLUMN "balEffect";

-- A rotação deixa de ser de uma temporada: vale sempre, e o vídeo muda com a temporada.
ALTER TABLE "Rotation" ADD COLUMN "effectVideos" JSONB NOT NULL DEFAULT '{}';
-- Rotação que era de uma temporada: os vídeos de BAX/BAL dela viram os vídeos daquela temporada.
UPDATE "Rotation" AS r
SET "effectVideos" = jsonb_strip_nulls(jsonb_build_object(s.bax, r."videoBax", s.bal, r."videoBal")),
    "videoBax" = NULL,
    "videoBal" = NULL
FROM (VALUES
  ('PARALYSIS', 'PARALYSIS', 'SHOCK'), ('SHOCK', 'PARALYSIS', 'SHOCK'),
  ('SILENCE', 'SILENCE', 'TRAP'), ('TRAP', 'SILENCE', 'TRAP'),
  ('BURN', 'BURN', 'FRACTURE'), ('FRACTURE', 'BURN', 'FRACTURE')
) AS s(effect, bax, bal)
WHERE r."effect" = s.effect;
ALTER TABLE "Rotation" DROP COLUMN "effect";
