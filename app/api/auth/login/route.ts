import { NextResponse, type NextRequest } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { urlAutorizacao } from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const state = crypto.randomUUID();
    const url = urlAutorizacao(`${origin}/api/auth/callback`, state);

    const resposta = NextResponse.redirect(url);
    // Cookie curto para validar o "state" no callback (proteção contra CSRF no fluxo OAuth).
    resposta.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return resposta;
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
