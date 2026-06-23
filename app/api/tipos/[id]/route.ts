import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { atualizarTipo, removerTipo } from "@/lib/sheets/tipos";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    const template = String(corpo?.template ?? "").trim();

    if (!nome || !template) {
      return NextResponse.json({ erro: "Nome e texto padrão são obrigatórios." }, { status: 400 });
    }

    const atualizado = await atualizarTipo(id, { nome, template });
    if (!atualizado) {
      return NextResponse.json({ erro: "Tipo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removido = await removerTipo(id);
    if (!removido) {
      return NextResponse.json({ erro: "Tipo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
