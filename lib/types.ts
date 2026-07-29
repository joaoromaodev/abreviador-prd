export interface PalavraAbreviacao {
  id: string;
  palavra: string;
  abreviacao: string;
}

export interface Configuracoes {
  limiteCaracteres: number;
  caseSensitive: boolean;
  reaplicarAteEstabilizar: boolean;
}

/**
 * Usuário do sistema. O e-mail (minúsculo) é a chave.
 * - `papel`: "admin" tem acesso total (ignora a checagem de setor) e gerencia usuários/cadastros;
 *   "usuario" acessa só os módulos dos setores listados em `setores`.
 * - `setores`: setores que o usuário comum pode acessar (ex.: ["CPED"], ["CEO"]). É ORTOGONAL ao
 *   papel. Lista vazia = tratada como ["CPED"] por retrocompatibilidade (ver lib/setores.ts).
 */
export interface Usuario {
  email: string;
  nome: string;
  papel: "admin" | "usuario";
  setores: string[];
  criadoEm: string;
  atualizadoEm: string;
}

/** Tipo de PRD (ex.: "Locação de Imóveis"). Guarda o texto padrão com os marcadores `<<>>` e `{}`. */
export interface TipoPRD {
  id: string;
  nome: string;
  template: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Um conjunto de valores específico de uma modalidade dentro do MESMO contrato (ex.: Terceirizada,
 * onde Administrativo / Ensino Médio / Ensino Fundamental têm plano interno, ação, etc. diferentes).
 * Preenche os campos `[[...]]` do template do tipo.
 */
export interface ModalidadeContrato {
  /** Nome exibido e impresso no PRD (ex.: "Ensino Fundamental"). Preenche o token reservado `[[modalidade]]`. */
  nome: string;
  /** Valores dos campos `[[...]]` do template, específicos desta modalidade. */
  valores: Record<string, string>;
}

/**
 * Contrato cadastrado. É a fonte de dados COMPARTILHADA entre os setores:
 * - CPED (PRD): usa `tipoId` + `valores`/`modalidades` (campos derivados do template do tipo).
 * - CEO (empenho): usa `dadosEmpenho` (bloco autocontido, independente do tipo) + vigência.
 *
 * `tipoId` é OPCIONAL: contrato sem tipo não gera PRD (some do gerador da CPED, que filtra por
 * `tipoId`) e existe só para o empenho da CEO.
 */
export interface Contrato {
  id: string;
  /** Tipo de PRD amarrado (CPED). Vazio = contrato só de empenho, sem PRD. */
  tipoId: string;
  /** Identificação para escolher o contrato (ex.: "Sede Administrativa - 123/2020"). */
  nome: string;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
  /** Vigência do contrato em ISO "YYYY-MM-DD" (vazio se não informada). */
  vigenciaInicio: string;
  vigenciaFim: string;
  /** Contrato de prazo indeterminado: sem data de fim, nunca marcado como vencido (raro). */
  vigenciaIndeterminada: boolean;
  valores: Record<string, string>;
  /** Modalidades do contrato (campos `[[...]]`). Vazio quando o tipo não usa modalidades (ex.: Locação). */
  modalidades: ModalidadeContrato[];
  /**
   * Dados para o empenho no SIAFE (setor CEO). Bloco autocontido com schema FIXO (ver
   * lib/empenho.ts): não depende do tipo/template e vale inclusive para contratos sem PRD.
   * Vazio em linhas antigas.
   */
  dadosEmpenho: Record<string, string>;
  criadoEm: string;
  atualizadoEm: string;
}
