import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirMaster } from "@/lib/auth/guard";
import { lerPapelInput, normalizarSetores } from "@/lib/usuarios-input";
import { buscarUsuario, criarUsuario, listarUsuarios } from "@/lib/sheets/usuarios";

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const guarda = await exigirMaster();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    return NextResponse.json(await listarUsuarios());
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guarda = await exigirMaster();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const corpo = await request.json();
    const email = String(corpo?.email ?? "").trim().toLowerCase();
    const nome = String(corpo?.nome ?? "").trim();
    const papel = lerPapelInput(corpo?.papel);
    const setores = normalizarSetores(corpo?.setores);

    if (!RE_EMAIL.test(email)) {
      return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
    }
    if (!nome) {
      return NextResponse.json({ erro: "Informe o nome do usuário." }, { status: 400 });
    }
    if (await buscarUsuario(email)) {
      return NextResponse.json({ erro: "Já existe um usuário com esse e-mail." }, { status: 409 });
    }

    const novo = await criarUsuario({ email, nome, papel, setores });
    return NextResponse.json(novo, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
