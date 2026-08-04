import type { Usuario } from "@/lib/types";
import type { Papel } from "@/lib/auth/session";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

// Aba "Usuarios": o e-mail (minúsculo) é a chave primária — guardado na coluna "id" para reusar os
// helpers de table.ts (que indexam por "id").
// "setores" fica por ÚLTIMO de propósito (mesmo padrão de contratos.ts): preserva a posição das
// colunas já gravadas; linha antiga simplesmente não tem essa coluna e vira lista vazia.
const ABA = "Usuarios";
const COLUNAS = ["id", "nome", "papel", "criadoEm", "atualizadoEm", "setores"];

/** Lê a lista de setores gravada como JSON (aceita também vazio → []). */
function lerSetores(bruto: string): string[] {
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista.map((s) => String(s)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Converte o texto da coluna "papel" para o tipo. Valor desconhecido/antigo vira "usuario". */
function lerPapel(bruto: string): Papel {
  return bruto === "master" ? "master" : bruto === "admin" ? "admin" : "usuario";
}

function paraUsuario(registro: Registro): Usuario {
  return {
    email: registro.id,
    nome: registro.nome,
    papel: lerPapel(registro.papel),
    setores: lerSetores(registro.setores),
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

/** E-mails de MASTER "de fábrica". Garantem que sempre exista um master, mesmo com a aba vazia. */
const MASTERS_PADRAO = ["joao.neto@seduc.pa.gov.br"];

/** Lista de e-mails a partir de uma variável de ambiente separada por vírgula. */
function emailsDeEnv(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * E-mails de MASTER: o padrão de fábrica (joao.neto) + os de BOOTSTRAP_MASTER_EMAILS.
 * O padrão garante acesso master em produção mesmo sem configurar a env.
 */
export function emailsBootstrapMaster(): string[] {
  return [...new Set([...MASTERS_PADRAO, ...emailsDeEnv(process.env.BOOTSTRAP_MASTER_EMAILS)])];
}

/** E-mails de admin (de setor) "de fábrica" (BOOTSTRAP_ADMIN_EMAILS) — acesso mesmo com a aba vazia. */
export function emailsBootstrap(): string[] {
  return emailsDeEnv(process.env.BOOTSTRAP_ADMIN_EMAILS);
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

export async function criarUsuario(dados: {
  email: string;
  nome: string;
  papel: Papel;
  setores: string[];
}): Promise<Usuario> {
  const id = dados.email.trim().toLowerCase();
  const agora = new Date().toISOString();
  await adicionarLinha(ABA, COLUNAS, {
    id,
    nome: dados.nome,
    papel: dados.papel,
    criadoEm: agora,
    atualizadoEm: agora,
    setores: JSON.stringify(dados.setores),
  });
  return { email: id, nome: dados.nome, papel: dados.papel, setores: dados.setores, criadoEm: agora, atualizadoEm: agora };
}

export async function atualizarUsuario(
  email: string,
  dados: { nome: string; papel: Papel; setores: string[] }
): Promise<Usuario | null> {
  const agora = new Date().toISOString();
  const registro = await atualizarLinha(ABA, COLUNAS, email.trim().toLowerCase(), {
    nome: dados.nome,
    papel: dados.papel,
    setores: JSON.stringify(dados.setores),
    atualizadoEm: agora,
  });
  return registro ? paraUsuario(registro) : null;
}

export async function removerUsuario(email: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, email.trim().toLowerCase());
}

/**
 * Decide se um e-mail pode entrar e com qual papel. O bootstrap tem precedência sobre a aba
 * (o master de fábrica não pode ser rebaixado por uma linha na planilha): master de bootstrap
 * entra como master; admin de bootstrap entra como admin; senão, usa o papel da aba Usuarios.
 * Retorna null se não autorizado.
 */
export async function autorizarAcesso(
  email: string,
  nomeLogin: string
): Promise<{ papel: Papel; nome: string; setores: string[] } | null> {
  const alvo = email.trim().toLowerCase();
  const usuario = await buscarUsuario(alvo);

  if (emailsBootstrapMaster().includes(alvo)) {
    // Master de bootstrap: acesso total, ignora a checagem de setor.
    return { papel: "master", nome: usuario?.nome || nomeLogin, setores: usuario?.setores ?? [] };
  }
  if (emailsBootstrap().includes(alvo)) {
    // Admin de bootstrap (de setor): gated pelos setores da aba (vazio recai em CPED).
    return { papel: "admin", nome: usuario?.nome || nomeLogin, setores: usuario?.setores ?? [] };
  }
  if (usuario) {
    return { papel: usuario.papel, nome: usuario.nome || nomeLogin, setores: usuario.setores };
  }
  return null;
}
