-- O Striker meta passa da rotação para o Causador de Dano de cada equipe Meta.

-- DropForeignKey
ALTER TABLE "Rotation" DROP CONSTRAINT "Rotation_strikerUniformId_fkey";

-- AlterTable
ALTER TABLE "Rotation" DROP COLUMN "strikerNote",
DROP COLUMN "strikerUniformId";

-- AlterTable
ALTER TABLE "MetaTeamMember" ADD COLUMN     "strikerUniformId" TEXT;

-- AddForeignKey
ALTER TABLE "MetaTeamMember" ADD CONSTRAINT "MetaTeamMember_strikerUniformId_fkey" FOREIGN KEY ("strikerUniformId") REFERENCES "Uniform"("id") ON DELETE SET NULL ON UPDATE CASCADE;
