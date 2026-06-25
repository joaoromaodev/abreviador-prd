import { NextResponse, type NextRequest } from "next/server";
import { trocarCodigoPorUsuario } from "@/lib/auth/google";
import { assinarSessao, COOKIE_SESSAO, opcoesCookie } from "@/lib/auth/session";
import { autorizarAcesso } from "@/lib/sheets/usuarios";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const stateCookie = request.cookies.get("oauth_state")?.value;

  function loginInvalido(motivo: string) {
    const resposta = NextResponse.redirect(`${origin}/login?erro=${motivo}`);
    resposta.cookies.delete("oauth_state");
    return resposta;
  }

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return loginInvalido("estado");
  }

  try {
    const usuario = await trocarCodigoPorUsuario(`${origin}/api/auth/callback`, code);
    if (!usuario) return loginInvalido("google");

    const acesso = await autorizarAcesso(usuario.email, usuario.nome);
    if (!acesso) return loginInvalido("nao-autorizado");

    const token = await assinarSessao({ email: usuario.email, nome: acesso.nome, papel: acesso.papel });
    const resposta = NextResponse.redirect(`${origin}/`);
    resposta.cookies.set(COOKIE_SESSAO, token, opcoesCookie());
    resposta.cookies.delete("oauth_state");
    return resposta;
  } catch {
    return loginInvalido("falha");
  }
}
