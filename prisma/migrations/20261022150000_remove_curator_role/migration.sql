-- O sistema passa a ter só dois papéis: membro comum (USER) e Administrador (ADMIN). Quem ainda
-- for Curador vira Administrador, para não perder o acesso ao conteúdo que já editava.
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'CURATOR';
