// Sessão "stateless": um token assinado (HMAC-SHA256 via Web Crypto) guardado num cookie httpOnly.
// Usa só Web Crypto (crypto.subtle) + btoa/atob, então funciona tanto no Node (rotas) quanto no
// edge (proxy). O conteúdo da sessão não é segredo — a assinatura garante só integridade.

export type Papel = "admin" | "usuario";

export interface Sessao {
  email: string;
  nome: string;
  papel: Papel;
  /** Setores que o usuário pode acessar (ver lib/setores.ts). Admin ignora essa checagem. */
  setores: string[];
  /** Expiração em epoch ms. */
  exp: number;
}

export const COOKIE_SESSAO = "sessao";
const DURACAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function segredo(): string {
  const valor = process.env.AUTH_SECRET;
  if (!valor) throw new Error("AUTH_SECRET não configurado.");
  return valor;
}

function paraBase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

async function assinar(corpo: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo));
  return paraBase64Url(new Uint8Array(assinatura));
}

/** Comparação em tempo constante para não vazar informação pelo tempo de resposta. */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

/** Cria o token assinado a partir dos dados da sessão (define a expiração). */
export async function assinarSessao(dados: Omit<Sessao, "exp">): Promise<string> {
  const sessao: Sessao = { ...dados, exp: Date.now() + DURACAO_MS };
  const corpo = paraBase64Url(new TextEncoder().encode(JSON.stringify(sessao)));
  return `${corpo}.${await assinar(corpo)}`;
}

/** Valida o token (assinatura + expiração) e devolve a sessão, ou null se inválido. */
export async function lerSessaoDeToken(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;
  if (!igualSeguro(assinatura, await assinar(corpo))) return null;
  try {
    const sessao = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as Sessao;
    if (!sessao.exp || sessao.exp < Date.now()) return null;
    // Tokens emitidos antes da coluna `setores` não têm o campo: normaliza para lista vazia
    // (tratada como ["CPED"] em setoresEfetivos), sem forçar novo login.
    if (!Array.isArray(sessao.setores)) sessao.setores = [];
    return sessao;
  } catch {
    return null;
  }
}

/** Opções do cookie de sessão (httpOnly, válido em todo o site). */
export function opcoesCookie(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(DURACAO_MS / 1000),
  };
}
