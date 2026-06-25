import type { Usuario } from "@/lib/types";
import type { Papel } from "@/lib/auth/session";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

// Aba "Usuarios": o e-mail (minúsculo) é a chave primária — guardado na coluna "id" para reusar os
// helpers de table.ts (que indexam por "id").
const ABA = "Usuarios";
const COLUNAS = ["id", "nome", "papel", "criadoEm", "atualizadoEm"];

function paraUsuario(registro: Registro): Usuario {
  return {
    email: registro.id,
    nome: registro.nome,
    papel: registro.papel === "admin" ? "admin" : "usuario",
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

/** E-mails de admin "de fábrica" (variável de ambiente) — garantem acesso mesmo com a aba vazia. */
export function emailsBootstrap(): string[] {
  return (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  return linhas.map(paraUsuario).sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function buscarUsuario(email: string): Promise<Usuario | null> {
  const alvo = email.trim().toLowerCase();
  const linhas = await lerLinhas(ABA, COLUNAS);
  const registro = linhas.find((l) => l.id.trim().toLowerCase() === alvo);
  return registro ? paraUsuario(registro) : null;
}

export async function criarUsuario(dados: { email: string; nome: string; papel: Papel }): Promise<Usuario> {
  const id = dados.email.trim().toLowerCase();
  const agora = new Date().toISOString();
  await adicionarLinha(ABA, COLUNAS, { id, nome: dados.nome, papel: dados.papel, criadoEm: agora, atualizadoEm: agora });
  return { email: id, nome: dados.nome, papel: dados.papel, criadoEm: agora, atualizadoEm: agora };
}

export async function atualizarUsuario(
  email: string,
  dados: { nome: string; papel: Papel }
): Promise<Usuario | null> {
  const agora = new Date().toISOString();
  const registro = await atualizarLinha(ABA, COLUNAS, email.trim().toLowerCase(), {
    nome: dados.nome,
    papel: dados.papel,
    atualizadoEm: agora,
  });
  return registro ? paraUsuario(registro) : null;
}

export async function removerUsuario(email: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, email.trim().toLowerCase());
}

/**
 * Decide se um e-mail pode entrar e com qual papel. Admin de bootstrap sempre entra como admin;
 * senão, precisa estar cadastrado na aba Usuarios. Retorna null se não autorizado.
 */
export async function autorizarAcesso(
  email: string,
  nomeLogin: string
): Promise<{ papel: Papel; nome: string } | null> {
  const alvo = email.trim().toLowerCase();
  const usuario = await buscarUsuario(alvo);

  if (emailsBootstrap().includes(alvo)) {
    return { papel: "admin", nome: usuario?.nome || nomeLogin };
  }
  if (usuario) {
    return { papel: usuario.papel, nome: usuario.nome || nomeLogin };
  }
  return null;
}
