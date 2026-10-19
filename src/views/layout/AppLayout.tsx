import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useTheme } from "next-themes";
import { LanguagesIcon, LogOutIcon, MenuIcon, MoonIcon, ShieldIcon, SunIcon } from "lucide-react";
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
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { BrandMark } from "./BrandMark";
import { SecurityNotices } from "./SecurityNotices";
import { NicknameMenu } from "./NicknameMenu";

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

/** Menu da curadoria (só para quem entrou como curador/administrador). */
function StaffMenu() {
  const { t } = useTranslation("common");
  const { user, isCurator, logout } = useAuthViewModel();
  const router = useRouter();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-touch" aria-label={t("nav.account")}>
          <ShieldIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="truncate">{user.nickname ?? user.email}</DropdownMenuLabel>
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
            if (router.pathname.startsWith("/admin")) router.push("/");
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-touch" className="md:hidden" aria-label={t("nav.menu")}>
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
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>

            <BrandMark />

            <NavigationMenu viewport={false} className="ml-6 hidden md:flex">
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

            <div className="ml-auto flex items-center gap-1">
              <LanguageMenu className="hidden sm:inline-flex" />
              <ThemeToggle className="hidden sm:inline-flex" />
              <NicknameMenu />
              <StaffMenu />
            </div>
          </div>
        </header>

        <main className={cn("mx-auto w-full flex-1 px-4 py-6", wide ? "max-w-7xl" : "max-w-6xl")}>
          <SecurityNotices />
          {children}
        </main>

        <footer className="border-t border-energy/10 py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-xs text-muted-foreground">
            <p className="font-heading tracking-wider text-energy/80 uppercase">{t("footer.alliance")}</p>
            <p>{t("footer.disclaimer")}</p>
            <p>{t("footer.credit")}</p>
            {/* Só a curadoria tem login; jogadores não precisam de conta. */}
            <Link href="/entrar" className="mt-1 self-start text-muted-foreground/80 underline-offset-2 hover:text-energy hover:underline">
              {t("footer.staff")}
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
