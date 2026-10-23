-- Dias de BAX/BAL sem restrição e a BAI com as mesmas equipes e reservas (ligado por padrão).
ALTER TABLE "Settings" ADD COLUMN "syncFreeDays" BOOLEAN NOT NULL DEFAULT true;
