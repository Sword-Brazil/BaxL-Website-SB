-- Cada personagem passa a ter dois CTPs na Meta (1 = padrão, 2 = opcional) e cada membro das
-- equipes Meta escolhe, por dia, qual dos dois usa.

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "metaCtp1Id" TEXT,
ADD COLUMN     "metaCtp2Id" TEXT;

-- AlterTable
ALTER TABLE "MetaTeamMember" ADD COLUMN     "ctpSlot" INTEGER;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_metaCtp1Id_fkey" FOREIGN KEY ("metaCtp1Id") REFERENCES "Ctp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_metaCtp2Id_fkey" FOREIGN KEY ("metaCtp2Id") REFERENCES "Ctp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Dados: CTP 1 e 2 de cada personagem = os dois CTPs mais usados por ele nas equipes Meta atuais.
WITH usage AS (
  SELECT u."agentId", m."ctpId",
         ROW_NUMBER() OVER (PARTITION BY u."agentId" ORDER BY COUNT(*) DESC, m."ctpId") AS rk
  FROM "MetaTeamMember" m
  JOIN "Uniform" u ON u."id" = m."uniformId"
  WHERE m."ctpId" IS NOT NULL
  GROUP BY u."agentId", m."ctpId"
)
UPDATE "Agent" a SET
  "metaCtp1Id" = (SELECT "ctpId" FROM usage WHERE usage."agentId" = a."id" AND rk = 1),
  "metaCtp2Id" = (SELECT "ctpId" FROM usage WHERE usage."agentId" = a."id" AND rk = 2);

-- Membros com um desses dois CTPs (ou sem CTP) passam a usar o slot; os demais ficam como estão
-- (CTP só daquela equipe) até o curador escolher um slot.
UPDATE "MetaTeamMember" m SET
  "ctpSlot" = CASE WHEN m."ctpId" IS NOT NULL AND m."ctpId" = a."metaCtp2Id" THEN 2 ELSE 1 END,
  "ctpId" = COALESCE(m."ctpId", a."metaCtp1Id")
FROM "Uniform" u
JOIN "Agent" a ON a."id" = u."agentId"
WHERE u."id" = m."uniformId"
  AND (m."ctpId" IS NULL OR m."ctpId" = a."metaCtp1Id" OR m."ctpId" = a."metaCtp2Id");
