// Fonte ÚNICA da regra "módulo → setor" e do controle de acesso (setor + papel).
// Usada tanto no servidor (guards em lib/auth/guard.ts, rotas /api) quanto no cliente
// (NavBar, layouts, formulários). Não espalhar essas regras por outros arquivos.

import type { Papel } from "./auth/session";

export type Setor = "CPED" | "CEO";

/** Perfil mínimo para as checagens de acesso (o que a sessão/usuário sempre têm). */
export interface PerfilAcesso {
  papel: Papel;
  setores: readonly string[];
}

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

// Módulos gated por setor. As telas de admin (Configurações, Cadastros) NÃO entram aqui.
// O Abreviador ("/") também não entra: é a home do CPED (ver hrefInicial), tratado à parte
// na NavBar e na própria página. Quem é só do CEO não enxerga o Abreviador.
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

/** Master acessa qualquer setor; admin e usuário acessam só os setores efetivos. */
export function podeAcessarSetor(perfil: PerfilAcesso, setor: Setor): boolean {
  if (perfil.papel === "master") return true;
  return setoresEfetivos(perfil.setores).includes(setor);
}

/**
 * Para onde o usuário deve ir por padrão (aterrissagem pós-login e "voltar pra home").
 * O Abreviador ("/") pertence ao CPED; quem acessa CPED (ou é master) cai nele. Quem é só de
 * outro setor (ex.: só CEO) vai direto para o primeiro módulo que pode acessar.
 */
export function hrefInicial(perfil: PerfilAcesso): string {
  if (podeAcessarSetor(perfil, "CPED")) return "/";
  const primeiro = MODULOS.find((m) => podeAcessarSetor(perfil, m.setor));
  return primeiro?.href ?? "/";
}

// ————————————————————————————————————————————————————————————————————————
// Capacidades (papel × setor). Master é o único que gerencia usuários/config; admin de setor
// cria/edita contratos (só o bloco do seu setor) e os cadastros do seu setor.
// ————————————————————————————————————————————————————————————————————————

/** Só o master gerencia usuários. */
export function podeGerenciarUsuarios(perfil: PerfilAcesso): boolean {
  return perfil.papel === "master";
}

/** Só o master mexe nas configurações. */
export function podeGerenciarConfiguracoes(perfil: PerfilAcesso): boolean {
  return perfil.papel === "master";
}

/**
 * Master, OU admin do setor informado. Base da separação por bloco/cadastro:
 * - bloco PRD do contrato, Categorias e Palavras ⇒ setor CPED;
 * - bloco de Empenho do contrato ⇒ setor CEO.
 */
export function ehAdminDoSetor(perfil: PerfilAcesso, setor: Setor): boolean {
  if (perfil.papel === "master") return true;
  return perfil.papel === "admin" && setoresEfetivos(perfil.setores).includes(setor);
}

/**
 * Pode criar contratos e editar os campos-BASE (identificação, vigência, termo aditivo).
 * O contrato é compartilhado, então master e QUALQUER admin editam a base; a separação por
 * setor vale só para os blocos PRD/Empenho (ver ehAdminDoSetor).
 */
export function podeEditarContratos(perfil: PerfilAcesso): boolean {
  return perfil.papel === "master" || perfil.papel === "admin";
}

/** Edita o bloco PRD do contrato (categoria, campos do template, modalidades): CPED. */
export function podeEditarBlocoPRD(perfil: PerfilAcesso): boolean {
  return ehAdminDoSetor(perfil, "CPED");
}

/** Edita o bloco de Empenho do contrato (dados do SIAFE): CEO. */
export function podeEditarBlocoEmpenho(perfil: PerfilAcesso): boolean {
  return ehAdminDoSetor(perfil, "CEO");
}

/** Tem acesso à área de Cadastros (algum poder de escrita): master ou admin. */
export function podeAlgumCadastro(perfil: PerfilAcesso): boolean {
  return perfil.papel === "master" || perfil.papel === "admin";
}
