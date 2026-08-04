import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ehAdminDoSetor,
  podeAcessarSetor,
  podeEditarContratos,
  type Setor,
} from "@/lib/setores";
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

/** Exige o MASTER. Use nas rotas de usuários e configurações. */
export async function exigirMaster(): Promise<Resultado> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (resultado.sessao.papel !== "master") {
    return { resposta: NextResponse.json({ erro: "Acesso restrito ao master." }, { status: 403 }) };
  }
  return resultado;
}

/**
 * Exige quem pode cadastrar/editar contratos (master ou qualquer admin). A autorização por BLOCO
 * (PRD é do CPED, Empenho é do CEO) é aplicada na própria rota via aplicarPermissoesContrato.
 */
export async function exigirEdicaoContrato(): Promise<Resultado> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (!podeEditarContratos(resultado.sessao)) {
    return { resposta: NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 }) };
  }
  return resultado;
}

/**
 * Exige master OU admin do setor informado. Use nos cadastros de um setor (ex.: Categorias e
 * Palavras são do CPED).
 */
export async function exigirAdminDoSetor(setor: Setor): Promise<Resultado> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (!ehAdminDoSetor(resultado.sessao, setor)) {
    return { resposta: NextResponse.json({ erro: `Acesso restrito ao admin do setor ${setor}.` }, { status: 403 }) };
  }
  return resultado;
}

/**
 * Exige que o usuário possa acessar um setor (admin sempre pode). Use nas rotas de API de um módulo.
 * Não substitui a checagem de página: gate de UI é feito no layout do módulo.
 */
export async function exigirSetor(setor: Setor): Promise<Resultado> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (!podeAcessarSetor(resultado.sessao, setor)) {
    return { resposta: NextResponse.json({ erro: `Acesso restrito ao setor ${setor}.` }, { status: 403 }) };
  }
  return resultado;
}
