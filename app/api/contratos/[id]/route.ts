import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirAdmin } from "@/lib/auth/guard";
import { lerCorpoContrato } from "@/lib/contratos-input";
import { atualizarContrato, removerContrato } from "@/lib/sheets/contratos";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirAdmin();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const { id } = await params;
    const dados = lerCorpoContrato(await request.json());
    if (typeof dados === "string") {
      return NextResponse.json({ erro: dados }, { status: 400 });
    }
    const atualizado = await atualizarContrato(id, dados);
    if (!atualizado) {
      return NextResponse.json({ erro: "Contrato não encontrado." }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirAdmin();
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
