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

/** Usuário do sistema. O e-mail (minúsculo) é a chave; `papel` define o que pode fazer. */
export interface Usuario {
  email: string;
  nome: string;
  papel: "admin" | "usuario";
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

/** Contrato cadastrado e amarrado a um tipo. `valores` guarda os campos `{}` do template do tipo. */
export interface Contrato {
  id: string;
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
  criadoEm: string;
  atualizadoEm: string;
}
