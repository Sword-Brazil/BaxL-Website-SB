import "@/styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appWithTranslation, useTranslation } from "next-i18next/pages";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSelectionsStore } from "@/viewmodels/stores/selectionsStore";
import { bodyFont, displayFont } from "@/styles/fonts";
import { setZodLocale } from "@/lib/zodLocale";

type I18nStore = Record<string, Record<string, object>>;

/**
 * O next-i18next só adiciona um namespace na primeira página que o usa; nas navegações seguintes
 * ignora as traduções novas que vêm do servidor (ex.: textos adicionados com a aba aberta, que
 * apareciam como "metas.addAlt"). Aqui elas são sempre mescladas antes de a página renderizar.
 */
function useMergeTranslations(store: I18nStore | undefined) {
  const { i18n } = useTranslation();
  // Uma vez por página recebida, e antes de ela renderizar (num efeito, o 1º quadro sairia errado).
  useMemo(() => {
    for (const [locale, namespaces] of Object.entries(store ?? {})) {
      for (const [ns, resources] of Object.entries(namespaces)) i18n.addResourceBundle(locale, ns, resources, true, true);
    }
  }, [store, i18n]);
}

function App({ Component, pageProps }: AppProps) {
  useMergeTranslations(pageProps._nextI18Next?.initialI18nStore);
  const { locale } = useRouter();
  // Antes de renderizar a página: as validações dos formulários usam o idioma escolhido.
  useMemo(() => setZodLocale(locale), [locale]);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }),
  );

  useEffect(() => {
    // Seleções do usuário salvas no aparelho (localStorage).
    useSelectionsStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Variáveis de fonte no :root para valerem também em portais (Dialog, Popover…). */}
      <style jsx global>{`
        :root {
          --font-display: ${displayFont.style.fontFamily};
          --font-body: ${bodyFont.style.fontFamily};
        }
      `}</style>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <TooltipProvider>
          <Component {...pageProps} />
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default appWithTranslation(App);
