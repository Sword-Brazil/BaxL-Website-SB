import type { NextConfig } from "next";
import i18nConfig from "./next-i18next.config.js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Política de conteúdo: só o próprio site, imagens do Supabase Storage e do YouTube (capas),
 * vídeos do YouTube sem cookies e arquivos de vídeo https. Ninguém pode colocar o site num iframe.
 * Em desenvolvimento, o Next precisa de eval e do WebSocket do recarregamento automático.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co https://i.ytimg.com${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob: https:",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Service worker sempre conferido no servidor: versão nova do site chega na próxima abertura.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
  i18n: i18nConfig.i18n,
  // /rotacoes/[slug] gera a página na hora (fallback: "blocking") e o serverSideTranslations lê a
  // config e os JSON do disco; sem isto a função da Vercel não os tem e a página dá 500.
  outputFileTracingIncludes: {
    "/rotacoes/*": ["./next-i18next.config.js", "./public/locales/**/*.json"],
    // Guia da Administração: fora de public/, lido do disco pelas rotas que exigem admin.
    "/api/admin/guide": ["./private/guide/admin.json"],
    "/api/admin/guide-image": ["./private/guide/*.jpg"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
  // BAX, BAL e BAI ficam juntos na tela central (/), com âncora por dia.
  async redirects() {
    return [
      { source: "/bax/:day(\\d+)", destination: "/#dia-:day", permanent: false },
      { source: "/bal/:day(\\d+)", destination: "/#dia-:day", permanent: false },
      { source: "/bax", destination: "/", permanent: false },
      { source: "/bal", destination: "/", permanent: false },
      { source: "/bai", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
