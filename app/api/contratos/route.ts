import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirEdicaoContrato, exigirSessao } from "@/lib/auth/guard";
import { aplicarPermissoesContrato, lerCorpoContrato } from "@/lib/contratos-input";
import { podeEditarBlocoEmpenho, podeEditarBlocoPRD } from "@/lib/setores";
import { criarContrato, listarContratos } from "@/lib/sheets/contratos";

export async function GET() {
  const guarda = await exigirSessao();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    return NextResponse.json(await listarContratos());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guarda = await exigirEdicaoContrato();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const dados = lerCorpoContrato(await request.json());
    if (typeof dados === "string") {
      return NextResponse.json({ erro: dados }, { status: 400 });
    }
    // Autorização por bloco: o editor só grava o(s) bloco(s) do seu setor (CEO ≠ CPED).
    const final = aplicarPermissoesContrato(dados, null, {
      prd: podeEditarBlocoPRD(guarda.sessao),
      empenho: podeEditarBlocoEmpenho(guarda.sessao),
    });
    const novo = await criarContrato(final);
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
