import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { criarTipo, listarTipos } from "@/lib/sheets/tipos";

export async function GET() {
  try {
    return NextResponse.json(await listarTipos());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    const template = String(corpo?.template ?? "").trim();

    if (!nome || !template) {
      return NextResponse.json({ erro: "Nome e texto padrão são obrigatórios." }, { status: 400 });
    }

    const novo = await criarTipo({ nome, template });
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
