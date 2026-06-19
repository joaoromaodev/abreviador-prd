import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { atualizarPalavra, removerPalavra } from "@/lib/sheets/palavras";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const corpo = await request.json();
    const palavra = String(corpo?.palavra ?? "").trim();
    const abreviacao = String(corpo?.abreviacao ?? "").trim();

    if (!palavra || !abreviacao) {
      return NextResponse.json({ erro: "Palavra e abreviação são obrigatórias." }, { status: 400 });
    }

    const atualizada = await atualizarPalavra(id, { palavra, abreviacao });
    if (!atualizada) {
      return NextResponse.json({ erro: "Palavra não encontrada." }, { status: 404 });
    }
    return NextResponse.json(atualizada);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removida = await removerPalavra(id);
    if (!removida) {
      return NextResponse.json({ erro: "Palavra não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
