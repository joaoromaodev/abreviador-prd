import { NextResponse, type NextRequest } from "next/server";

// Gate "otimista": só checa a PRESENÇA do cookie de sessão e redireciona para /login quando falta.
// A validação real (assinatura, papel) acontece nas rotas /api e nas páginas — aqui é só UX.
// (No Next 16 o antigo "middleware" passou a se chamar "proxy".)
const COOKIE_SESSAO = "sessao";

export function proxy(request: NextRequest) {
  const logado = request.cookies.has(COOKIE_SESSAO);
  const ehLogin = request.nextUrl.pathname === "/login";

  if (!logado && !ehLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (logado && ehLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Não roda nas rotas de API (elas se protegem sozinhas), nem em estáticos/imagens.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
