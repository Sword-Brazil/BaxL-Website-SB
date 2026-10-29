import "@/styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appWithTranslation, useTranslation } from "next-i18next/pages";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/models/api/client";
import { APP_ERRORS, classifyError } from "@/models/domain/appErrors";
import { useSelectionsStore } from "@/viewmodels/stores/selectionsStore";
import { notifyErrorClient } from "@/viewmodels/useNotify";
import { GlobalProgress } from "@/views/layout/GlobalProgress";
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
  const { i18n } = useTranslation();
  const [queryClient] = useState(() => {
    // Erros graves (rede, banco, servidor, acesso negado, sessão) viram o alerta fixo na tela, de
    // qualquer consulta ou ação; os leves ficam com cada tela (notificação ou o aviso da própria tela).
    const onError = (e: Error) => {
      // Site em manutenção vale para qualquer rota, inclusive o login e o /api/auth/me.
      if (classifyError(e) === "MAINTENANCE") return notifyErrorClient(i18n.t.bind(i18n), e);
      // Senha errada (401) e bloqueio (429) no login aparecem no próprio formulário.
      if (e instanceof ApiError && e.url?.startsWith("/api/auth/")) return;
      if (e instanceof ApiError && e.status === 401) client.setQueryData(["me"], null);
      if (APP_ERRORS[classifyError(e)] !== "INFO") notifyErrorClient(i18n.t.bind(i18n), e);
    };
    const client = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          // Só repete falhas passageiras (rede, banco, servidor); acesso negado, sessão encerrada e
          // dados inválidos não mudam com nova tentativa e aparecem na hora.
          retry: (count, e) => count < 2 && ["NETWORK", "DATABASE", "SERVER"].includes(classifyError(e)),
        },
      },
    });
    return client;
  });

  useEffect(() => {
    // Seleções do usuário salvas no aparelho (localStorage).
    useSelectionsStore.persist.rehydrate();
    // App instalável (PWA). Fora do build de produção, o cache do service worker atrapalharia o dev.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }
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
          <GlobalProgress />
          <Component {...pageProps} />
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default appWithTranslation(App);
