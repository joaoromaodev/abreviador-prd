import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { atualizarModelo, removerModelo } from "@/lib/sheets/modelos";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    const conteudo = String(corpo?.conteudo ?? "").trim();

    if (!nome || !conteudo) {
      return NextResponse.json({ erro: "Nome e conteúdo são obrigatórios." }, { status: 400 });
    }

    const atualizado = await atualizarModelo(id, { nome, conteudo });
    if (!atualizado) {
      return NextResponse.json({ erro: "Modelo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removido = await removerModelo(id);
    if (!removido) {
      return NextResponse.json({ erro: "Modelo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
