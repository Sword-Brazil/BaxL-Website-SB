import "@/styles/globals.css";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appWithTranslation } from "next-i18next/pages";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSelectionsStore } from "@/viewmodels/stores/selectionsStore";
import { bodyFont, displayFont } from "@/styles/fonts";

function App({ Component, pageProps }: AppProps) {
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
