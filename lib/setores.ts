// Fonte ÚNICA da regra "módulo → setor" e do controle de acesso por setor.
// Usada tanto no servidor (guards em lib/auth/guard.ts, rotas /api) quanto no cliente
// (NavBar, layouts dos módulos). Não espalhar essa regra por outros arquivos.

export type Setor = "CPED" | "CEO";

/** Todos os setores existentes. */
export const SETORES: readonly Setor[] = ["CPED", "CEO"] as const;

export const ROTULO_SETOR: Record<Setor, string> = {
  CPED: "CPED — PRD",
  CEO: "CEO — Empenho",
};

/** Um módulo do sistema e o setor a que pertence. */
export interface Modulo {
  /** Identificador estável. */
  id: string;
  href: string;
  label: string;
  setor: Setor;
}

// Módulos gated por setor. As telas GENÉRICAS (Abreviador, Configurações, Cadastros) NÃO entram
// aqui: Abreviador é a home acessível a qualquer autenticado; Cadastros/Configurações são de admin.
export const MODULOS: readonly Modulo[] = [
  { id: "modelos", href: "/modelos", label: "Modelos de PRD", setor: "CPED" },
  { id: "calculadora", href: "/calculadora", label: "Calculadora de Locação", setor: "CPED" },
  { id: "empenho", href: "/empenho", label: "Consulta para Empenho", setor: "CEO" },
] as const;

function ehSetor(valor: string): valor is Setor {
  return (SETORES as readonly string[]).includes(valor);
}

/**
 * Setores efetivos de um usuário comum. Lista vazia (linha antiga, anterior à coluna `setores`)
 * é tratada como ["CPED"] — o único módulo que existia antes desta separação —, para ninguém
 * perder acesso ao PRD na migração.
 */
export function setoresEfetivos(setores: readonly string[] | undefined): Setor[] {
  const validos = (setores ?? []).filter(ehSetor);
  return validos.length > 0 ? validos : ["CPED"];
}

/** Admin acessa tudo; usuário comum acessa só os setores efetivos. */
export function podeAcessarSetor(
  perfil: { papel: "admin" | "usuario"; setores: readonly string[] },
  setor: Setor
): boolean {
  if (perfil.papel === "admin") return true;
  return setoresEfetivos(perfil.setores).includes(setor);
}
