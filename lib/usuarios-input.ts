import { SETORES } from "@/lib/setores";
import type { Papel } from "@/lib/auth/session";

/** Mantém só setores válidos e sem repetição, na ordem canônica de SETORES. */
export function normalizarSetores(bruto: unknown): string[] {
  const lista = Array.isArray(bruto) ? bruto.map((s) => String(s)) : [];
  return SETORES.filter((s) => lista.includes(s));
}

/** Lê o papel vindo do corpo da requisição; qualquer coisa fora do conjunto vira "usuario". */
export function lerPapelInput(bruto: unknown): Papel {
  return bruto === "master" ? "master" : bruto === "admin" ? "admin" : "usuario";
}
