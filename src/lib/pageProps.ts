import type { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { BATTLE_DAY_NUMBERS } from "@/models/domain/enums";

/** getStaticProps que só carrega as traduções: os dados vêm dos ViewModels no cliente. */
export const withTranslations =
  (namespaces: string[]): GetStaticProps =>
  async ({ locale, params }) => ({
    props: { ...(await serverSideTranslations(locale ?? "pt-BR", ["common", ...namespaces])), params: params ?? null },
  });

/** Os 24 dias de BAX/BAL em todos os idiomas; dias de BAI e números inválidos dão 404. */
export const battleDayPaths: GetStaticPaths = async ({ locales = ["pt-BR"] }) => ({
  paths: locales.flatMap((locale) => BATTLE_DAY_NUMBERS.map((n) => ({ params: { day: String(n) }, locale }))),
  fallback: false,
});
