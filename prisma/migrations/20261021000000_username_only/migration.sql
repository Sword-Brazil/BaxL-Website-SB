-- Login só por nome de usuário + senha. Contas sem nome de usuário (as antigas, só com e-mail)
-- são apagadas: equipes Meta que elas editaram ficam sem autor (ON DELETE SET NULL) e os
-- avisos e seleções delas saem junto (ON DELETE CASCADE).
DELETE FROM "User" WHERE "username" IS NULL;

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "emailVerifiedAt",
ALTER COLUMN "username" SET NOT NULL;
