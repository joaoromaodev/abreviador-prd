import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { lerCorpoContrato } from "@/lib/contratos-input";
import { criarContrato, listarContratos } from "@/lib/sheets/contratos";

export async function GET() {
  try {
    return NextResponse.json(await listarContratos());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const dados = lerCorpoContrato(await request.json());
    if (typeof dados === "string") {
      return NextResponse.json({ erro: dados }, { status: 400 });
    }
    const novo = await criarContrato(dados);
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
