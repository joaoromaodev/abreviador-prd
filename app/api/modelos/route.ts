import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { criarModelo, listarModelos } from "@/lib/sheets/modelos";

export async function GET() {
  try {
    return NextResponse.json(await listarModelos());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    const conteudo = String(corpo?.conteudo ?? "").trim();

    if (!nome || !conteudo) {
      return NextResponse.json({ erro: "Nome e conteúdo são obrigatórios." }, { status: 400 });
    }

    const novo = await criarModelo({ nome, conteudo });
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
