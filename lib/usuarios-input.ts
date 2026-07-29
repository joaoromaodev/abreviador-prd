import { SETORES } from "@/lib/setores";

/** Mantém só setores válidos e sem repetição, na ordem canônica de SETORES. */
export function normalizarSetores(bruto: unknown): string[] {
  const lista = Array.isArray(bruto) ? bruto.map((s) => String(s)) : [];
  return SETORES.filter((s) => lista.includes(s));
}
