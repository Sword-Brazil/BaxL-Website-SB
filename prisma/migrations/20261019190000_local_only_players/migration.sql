-- Jogadores não têm mais conta: os dados ficam no aparelho (localStorage). Saem os tokens
-- de e-mail (confirmação/redefinição), as seleções sincronizadas e os avisos de conta de jogador.
DELETE FROM "SecurityNotice" WHERE "type" = 'EMAIL_UNVERIFIED';

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuthToken";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserSelectionsDoc";
PRAGMA foreign_keys=on;

