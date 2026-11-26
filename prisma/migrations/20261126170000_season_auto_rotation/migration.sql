-- A temporada passa sozinha para a seguinte no Dia 1 de cada ciclo: guarda o ciclo em que a
-- temporada salva valia (preenchido pelo sistema na primeira leitura).
ALTER TABLE "Settings" ADD COLUMN "seasonCycle" INTEGER;

-- Dobradinha: a equipe Meta (principal ou alternativa) é uma dobradinha.
ALTER TABLE "MetaTeam" ADD COLUMN "isDuo" BOOLEAN NOT NULL DEFAULT false;
