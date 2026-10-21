import { Head, Html, Main, NextScript } from "next/document";
import { FONT_SIZE_SCRIPT } from "@/views/layout/FontSizeMenu";

// O atributo `lang` do <html> é definido pelo Next a partir do locale (i18n do Pages Router).
export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/brand/favicon.png" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        <meta name="theme-color" content="#0f1720" />
        {/* Aplica o tamanho de fonte salvo antes da primeira pintura, para a tela não "pular". */}
        <script dangerouslySetInnerHTML={{ __html: FONT_SIZE_SCRIPT }} />
      </Head>
      <body className="min-h-dvh antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
