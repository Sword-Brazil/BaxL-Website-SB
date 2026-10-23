-- Ordem das equipes alternativas de cada dia (o ADMIN reordena; a principal vem sempre primeiro).

-- AlterTable
ALTER TABLE "MetaTeam" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Dados: mantém a ordem de hoje (editada por último primeiro) em cada escopo e dia.
UPDATE "MetaTeam" m SET "position" = o.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "scope", "battleDayId" ORDER BY "isPrimary" DESC, "updatedAt" DESC) AS rn
  FROM "MetaTeam"
) o
WHERE o."id" = m."id";
