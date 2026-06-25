import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirAdmin, exigirSessao } from "@/lib/auth/guard";
import { criarPalavra, listarPalavras } from "@/lib/sheets/palavras";

export async function GET() {
  const guarda = await exigirSessao();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    return NextResponse.json(await listarPalavras());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guarda = await exigirAdmin();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const corpo = await request.json();
    const palavra = String(corpo?.palavra ?? "").trim();
    const abreviacao = String(corpo?.abreviacao ?? "").trim();

    if (!palavra || !abreviacao) {
      return NextResponse.json({ erro: "Palavra e abreviação são obrigatórias." }, { status: 400 });
    }

    const existentes = await listarPalavras();
    const jaExiste = existentes.some((item) => item.palavra.toLowerCase() === palavra.toLowerCase());
    if (jaExiste) {
      return NextResponse.json({ erro: "Essa palavra já está cadastrada." }, { status: 409 });
    }

    const nova = await criarPalavra({ palavra, abreviacao });
    return NextResponse.json(nova, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
