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

/** Tipo de PRD (ex.: "Locação de Imóveis"). Guarda o texto padrão com os marcadores `<<>>` e `{}`. */
export interface TipoPRD {
  id: string;
  nome: string;
  template: string;
  criadoEm: string;
  atualizadoEm: string;
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
  valores: Record<string, string>;
  criadoEm: string;
  atualizadoEm: string;
}
