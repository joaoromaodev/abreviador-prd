import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESSAO, lerSessaoDeToken, type Sessao } from "./session";

/** Lê e valida a sessão do cookie da requisição atual (ou null). */
export async function sessaoAtual(): Promise<Sessao | null> {
  const cookieStore = await cookies();
  return lerSessaoDeToken(cookieStore.get(COOKIE_SESSAO)?.value);
}

type Resultado = { sessao: Sessao } | { resposta: NextResponse };

/** Exige um usuário logado. Use nas rotas de leitura. */
export async function exigirSessao(): Promise<Resultado> {
  const sessao = await sessaoAtual();
  if (!sessao) return { resposta: NextResponse.json({ erro: "Não autenticado." }, { status: 401 }) };
  return { sessao };
}

/** Exige um usuário admin. Use nas rotas de escrita (POST/PUT/DELETE). */
export async function exigirAdmin(): Promise<Resultado> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (resultado.sessao.papel !== "admin") {
    return { resposta: NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 }) };
  }
  return resultado;
}
