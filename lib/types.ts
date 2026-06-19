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

export interface ModeloPRD {
  id: string;
  nome: string;
  conteudo: string;
  criadoEm: string;
  atualizadoEm: string;
}
