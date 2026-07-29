import { NextResponse } from "next/server";
import { sessaoAtual } from "@/lib/auth/guard";

export async function GET() {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ usuario: null });
  return NextResponse.json({
    usuario: { email: sessao.email, nome: sessao.nome, papel: sessao.papel, setores: sessao.setores },
  });
}
