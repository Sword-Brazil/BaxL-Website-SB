-- Temporadas da BA: efeito que atordoa o chefe na BAX e na BAL (a atual é Paralisia / Choque),
-- efeitos que cada traje causa, e rotações por temporada com o Striker recomendado.

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "balEffect" TEXT NOT NULL DEFAULT 'SHOCK',
ADD COLUMN     "baxEffect" TEXT NOT NULL DEFAULT 'PARALYSIS';

-- AlterTable
ALTER TABLE "Uniform" ADD COLUMN     "effects" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Rotation" ADD COLUMN     "effect" TEXT,
ADD COLUMN     "strikerNote" TEXT,
ADD COLUMN     "strikerUniformId" TEXT;

-- AddForeignKey
ALTER TABLE "Rotation" ADD CONSTRAINT "Rotation_strikerUniformId_fkey" FOREIGN KEY ("strikerUniformId") REFERENCES "Uniform"("id") ON DELETE SET NULL ON UPDATE CASCADE;
