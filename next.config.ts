import type { NextConfig } from "next";
import i18nConfig from "./next-i18next.config.js";

const nextConfig: NextConfig = {
  i18n: i18nConfig.i18n,
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
