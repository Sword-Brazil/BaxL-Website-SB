import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { isSessionActive, sessionOptions } from "@/server/sessionOptions";
import type { SessionData } from "@/server/session";

/**
 * Site privado da aliança: sem sessão, nada além da tela de login. Páginas vão para /entrar
 * (voltando depois para onde a pessoa ia) e APIs respondem 401. Cada rota de API também confere a
 * sessão no banco (requireUser/requireRole); aqui é a primeira barreira, sem acessar o banco.
 */
const PUBLIC_PAGES = new Set(["/entrar"]);
const PUBLIC_APIS = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/me"]);
const LOCALE_PREFIX = /^\/(pt-BR|en|es)(?=\/|$)/;

async function hasSession(request: NextRequest) {
  const options = sessionOptions();
  const seal = request.cookies.get(options.cookieName)?.value;
  if (!seal) return false;
  const data = await unsealData<SessionData>(seal, { password: options.password, ttl: options.ttl }).catch(() => ({}) as SessionData);
  return isSessionActive(data);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(LOCALE_PREFIX, "") || "/";
  const isApi = path.startsWith("/api/");
  if ((isApi ? PUBLIC_APIS : PUBLIC_PAGES).has(path)) return NextResponse.next();
  if (await hasSession(request)) return NextResponse.next();

  // Dados das páginas (/_next/data) também levam 401, não redirect: o Next guardaria o redirect
  // de um pré-carregamento (ex.: o link do logo na tela de login) e, depois de entrar, mandaria a
  // pessoa de volta para /entrar. Com 401 ele faz a navegação completa, que cai no redirect abaixo.
  if (isApi || request.headers.has("x-nextjs-data")) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Faça login para continuar" } }, { status: 401 });
  }
  const login = request.nextUrl.clone();
  login.pathname = `${request.nextUrl.locale && request.nextUrl.locale !== request.nextUrl.defaultLocale ? `/${request.nextUrl.locale}` : ""}/entrar`;
  login.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  // Tudo, menos arquivos do Next, imagens públicas, traduções e ícones.
  // A raiz entra à parte: com o i18n do Pages Router, "/" não casa com o padrão abaixo.
  matcher: ["/", "/((?!_next/static|_next/image|assets/|brand/|locales/|favicon\\.ico|robots\\.txt).*)"],
};
