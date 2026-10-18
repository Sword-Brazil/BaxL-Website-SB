// @ts-check
/** @type {import('next-i18next/pages').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR", "en", "es"],
    // Sempre abre em português; trocar de idioma é só pelo menu (não segue o idioma do navegador).
    localeDetection: false,
  },
  // Recarrega os JSON de tradução em desenvolvimento.
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
