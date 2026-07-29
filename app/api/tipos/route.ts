import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirAdmin, exigirSessao } from "@/lib/auth/guard";
import { criarTipo, listarTipos } from "@/lib/sheets/tipos";

export async function GET() {
  const guarda = await exigirSessao();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    return NextResponse.json(await listarTipos());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guarda = await exigirAdmin();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    // Template opcional: categoria sem template não gera PRD (só serve para empenho/classificação).
    const template = String(corpo?.template ?? "").trim();

    if (!nome) {
      return NextResponse.json({ erro: "Informe o nome da categoria." }, { status: 400 });
    }

    const novo = await criarTipo({ nome, template });
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
