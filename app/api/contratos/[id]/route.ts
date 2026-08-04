import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirEdicaoContrato, exigirMaster } from "@/lib/auth/guard";
import { aplicarPermissoesContrato, lerCorpoContrato } from "@/lib/contratos-input";
import { podeEditarBlocoEmpenho, podeEditarBlocoPRD } from "@/lib/setores";
import { atualizarContrato, buscarContrato, removerContrato } from "@/lib/sheets/contratos";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirEdicaoContrato();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const { id } = await params;
    const dados = lerCorpoContrato(await request.json());
    if (typeof dados === "string") {
      return NextResponse.json({ erro: dados }, { status: 400 });
    }
    const atual = await buscarContrato(id);
    if (!atual) {
      return NextResponse.json({ erro: "Contrato não encontrado." }, { status: 404 });
    }
    // Autorização por bloco: preserva o bloco do outro setor, sobrescreve só o que o editor pode.
    const final = aplicarPermissoesContrato(dados, atual, {
      prd: podeEditarBlocoPRD(guarda.sessao),
      empenho: podeEditarBlocoEmpenho(guarda.sessao),
    });
    const atualizado = await atualizarContrato(id, final);
    if (!atualizado) {
      return NextResponse.json({ erro: "Contrato não encontrado." }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

// Remover o contrato apaga a linha inteira — inclusive o bloco do OUTRO setor. Por isso é
// restrito ao master (o admin de setor edita/limpa só o seu bloco, mas não apaga o contrato).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirMaster();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const { id } = await params;
    const removido = await removerContrato(id);
    if (!removido) {
      return NextResponse.json({ erro: "Contrato não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
