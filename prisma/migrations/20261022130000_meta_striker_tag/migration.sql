-- Tag de Striker meta no traje: o seletor de Striker dos Causadores de Dano mostra só os marcados.

-- AlterTable
ALTER TABLE "Uniform" ADD COLUMN     "isMetaStriker" BOOLEAN NOT NULL DEFAULT false;

-- Dados: quem já é Striker em alguma equipe Meta começa marcado.
UPDATE "Uniform" SET "isMetaStriker" = true
WHERE "id" IN (SELECT DISTINCT "strikerUniformId" FROM "MetaTeamMember" WHERE "strikerUniformId" IS NOT NULL);
