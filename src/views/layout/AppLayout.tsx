import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useTheme } from "next-themes";
import { CloudCheckIcon, LanguagesIcon, LogInIcon, LogOutIcon, MenuIcon, MoonIcon, ShieldIcon, SunIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { displayName } from "@/models/domain/types";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { BrandMark } from "./BrandMark";
import { CriticalErrorBanner } from "./CriticalErrorBanner";
import { FontSizeMenu } from "./FontSizeMenu";
import { SecurityNotices } from "./SecurityNotices";
import { NicknameMenu } from "./NicknameMenu";
import { SelectionsSyncDialog } from "./SelectionsSyncDialog";
import { SupportFooter } from "./SupportFooter";

const NAV = [
  { href: "/", key: "battle" },
  { href: "/meu-elenco", key: "roster" },
  { href: "/rotacoes", key: "rotations" },
  { href: "/estatisticas", key: "stats" },
] as const;

/** Menu ☰ do celular: inclui a Administração para curadores (no PC ela fica no menu da conta). */
function MobileNav({ pathname }: { pathname: string }) {
  const { t } = useTranslation("common");
  const { isCurator } = useAuthViewModel();
  const items = [...NAV, ...(isCurator ? [{ href: "/admin", key: "admin" } as const] : [])];
  return (
    <nav className="flex flex-col gap-1 px-4">
      {items.map((item) => (
        <SheetClose asChild key={item.href}>
          <Button
            asChild
            variant={isActive(pathname, item.href) ? "secondary" : "ghost"}
            size="touch"
            className="justify-start font-heading tracking-wider uppercase"
          >
            <Link href={item.href}>
              {item.key === "admin" && <ShieldIcon data-icon="inline-start" />}
              {t(`nav.${item.key}`)}
            </Link>
          </Button>
        </SheetClose>
      ))}
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function LanguageMenu({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-touch" className={className} aria-label={t("language.label")}>
          <LanguagesIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={router.locale}
          onValueChange={(locale) => router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale })}
        >
          {(router.locales ?? []).map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {t(`language.${l}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-touch"
      className={className}
      aria-label={t("theme.toggle")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}

/** Conta: "Entrar" para visitantes; para quem entrou, o nome, a administração (curadoria) e "Sair". */
function AccountMenu() {
  const { t } = useTranslation("common");
  const { user, isCurator, isLoading, logout } = useAuthViewModel();
  const router = useRouter();
  if (isLoading) return null;
  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon-touch" className="sm:w-auto sm:px-3" aria-label={t("nav.login")}>
        <Link href="/entrar">
          <LogInIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{t("nav.login")}</span>
        </Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-touch" aria-label={t("nav.account")}>
          {isCurator ? <ShieldIcon /> : <UserRoundIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{displayName(user)}</span>
          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <CloudCheckIcon className="size-3.5" />
            {t("nav.synced")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isCurator && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldIcon />
              {t("nav.admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            router.push("/entrar");
          }}
        >
          <LogOutIcon />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ title, children, wide = false }: { title?: string; children: ReactNode; wide?: boolean }) {
  const { t } = useTranslation("common");
  const { pathname } = useRouter();
  // Site privado: quem ainda não entrou (só vê a tela de login) não tem navegação.
  const { isLoggedIn } = useAuthViewModel();
  const pageTitle = title ? `${title} · ${t("brand.name")}` : t("brand.title");

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:image" content="/brand/og.jpg" />
      </Head>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-energy/15 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            {isLoggedIn && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon-touch" className="xl:hidden" aria-label={t("nav.menu")}>
                    <MenuIcon />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                    <BrandMark />
                  </SheetHeader>
                  <Separator />
                  <MobileNav pathname={pathname} />
                  <Separator />
                  <div className="flex items-center gap-1 px-4">
                    <LanguageMenu />
                    <FontSizeMenu />
                    <ThemeToggle />
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <BrandMark />

            {isLoggedIn && (
              <NavigationMenu viewport={false} className="ml-4 hidden xl:flex">
                <NavigationMenuList>
                  {NAV.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        asChild
                        active={isActive(pathname, item.href)}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "font-heading tracking-wider uppercase data-active:text-energy",
                        )}
                      >
                        <Link href={item.href}>{t(`nav.${item.key}`)}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}

            <div className="ml-auto flex items-center gap-1">
              <LanguageMenu className="hidden sm:inline-flex" />
              <FontSizeMenu className="hidden sm:inline-flex" />
              <ThemeToggle className="hidden sm:inline-flex" />
              {isLoggedIn && <NicknameMenu />}
              {/* Na própria tela de login o botão "Entrar" seria redundante. */}
              {pathname !== "/entrar" && <AccountMenu />}
            </div>
          </div>
        </header>

        <main className={cn("mx-auto w-full flex-1 px-4 py-6", wide ? "max-w-7xl" : "max-w-6xl")}>
          <CriticalErrorBanner />
          <SecurityNotices />
          {children}
        </main>
        <SelectionsSyncDialog />

        <footer className="border-t border-energy/10 py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-xs text-muted-foreground">
            <p className="font-heading tracking-wider text-energy/80 uppercase">{t("footer.alliance")}</p>
            <p>{t("footer.disclaimer")}</p>
            <p>{t("footer.credit")}</p>
            <SupportFooter />
          </div>
        </footer>
      </div>
    </>
  );
}
