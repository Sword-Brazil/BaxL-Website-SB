-- Chaves de identidade da conta: o nome sem acentos, em minúsculas e só com letras e números
-- (mesma regra de src/models/rules/userIdentity.ts). Duas contas não podem ter a mesma chave de
-- usuário nem de apelido no jogo.
ALTER TABLE "User" ADD COLUMN "usernameKey" TEXT,
ADD COLUMN "nicknameKey" TEXT;

-- Contas já existentes: se duas já colidem, só a mais antiga fica com a chave (a migração não
-- falha); a outra aparece como duplicada para o administrador excluir.
WITH keyed AS (
  SELECT "id",
    NULLIF(regexp_replace(lower("username"), '[^[:alnum:]]', '', 'g'), '') AS ukey,
    NULLIF(regexp_replace(translate(lower(coalesce("nickname", '')),
      'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny'), '[^[:alnum:]]', '', 'g'), '') AS nkey,
    "createdAt"
  FROM "User"
), ranked AS (
  SELECT "id", ukey, nkey,
    row_number() OVER (PARTITION BY ukey ORDER BY "createdAt", "id") AS urank,
    row_number() OVER (PARTITION BY nkey ORDER BY "createdAt", "id") AS nrank
  FROM keyed
)
UPDATE "User" u
SET "usernameKey" = CASE WHEN r.urank = 1 THEN r.ukey END,
    "nicknameKey" = CASE WHEN r.nrank = 1 THEN r.nkey END
FROM ranked r
WHERE u."id" = r."id";

-- CreateIndex
CREATE UNIQUE INDEX "User_usernameKey_key" ON "User"("usernameKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_nicknameKey_key" ON "User"("nicknameKey");
