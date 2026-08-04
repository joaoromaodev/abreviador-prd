import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirMaster, exigirSessao } from "@/lib/auth/guard";
import { LIMITE_CARACTERES_MAX, LIMITE_CARACTERES_MIN } from "@/lib/constants";
import { obterConfiguracoes, salvarConfiguracoes } from "@/lib/sheets/configuracoes";

export async function GET() {
  const guarda = await exigirSessao();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    return NextResponse.json(await obterConfiguracoes());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const guarda = await exigirMaster();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const corpo = await request.json();
    const limite = Number(corpo?.limiteCaracteres);

    if (!Number.isFinite(limite) || limite < LIMITE_CARACTERES_MIN || limite > LIMITE_CARACTERES_MAX) {
      return NextResponse.json(
        { erro: `Limite de caracteres deve estar entre ${LIMITE_CARACTERES_MIN} e ${LIMITE_CARACTERES_MAX}.` },
        { status: 400 }
      );
    }

    const salva = await salvarConfiguracoes({
      limiteCaracteres: Math.floor(limite),
      caseSensitive: Boolean(corpo?.caseSensitive),
      reaplicarAteEstabilizar: Boolean(corpo?.reaplicarAteEstabilizar),
    });

    return NextResponse.json(salva);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
