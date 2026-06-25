import { NextResponse } from "next/server";
import { mensagemErro } from "@/lib/api-errors";
import { exigirAdmin } from "@/lib/auth/guard";
import { atualizarUsuario, removerUsuario } from "@/lib/sheets/usuarios";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirAdmin();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const email = decodeURIComponent((await params).id).toLowerCase();
    const corpo = await request.json();
    const nome = String(corpo?.nome ?? "").trim();
    const papel = corpo?.papel === "admin" ? "admin" : "usuario";

    if (!nome) {
      return NextResponse.json({ erro: "Informe o nome do usuário." }, { status: 400 });
    }
    // Evita o admin se rebaixar e perder o acesso sem querer.
    if (email === guarda.sessao.email && papel !== "admin") {
      return NextResponse.json({ erro: "Você não pode remover o seu próprio acesso de admin." }, { status: 400 });
    }

    const atualizado = await atualizarUsuario(email, { nome, papel });
    if (!atualizado) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json(atualizado);
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await exigirAdmin();
  if ("resposta" in guarda) return guarda.resposta;
  try {
    const email = decodeURIComponent((await params).id).toLowerCase();
    if (email === guarda.sessao.email) {
      return NextResponse.json({ erro: "Você não pode remover a si mesmo." }, { status: 400 });
    }

    const removido = await removerUsuario(email);
    if (!removido) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return NextResponse.json({ erro: mensagemErro(erro) }, { status: 500 });
  }
}
