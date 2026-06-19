import type { Configuracoes } from "./types";

export const STORAGE_KEYS = {
  // Único uso restante do localStorage: passar o conteúdo de um modelo da aba "Modelos de
  // PRDs" pra caixa de texto da aba "Abreviador" ao navegar entre as duas. Palavras,
  // configurações e modelos em si ficam na planilha (lib/sheets/*), compartilhados pela equipe.
  rascunho: "abreviador-prd:rascunho",
} as const;

export const CONFIG_PADRAO: Configuracoes = {
  limiteCaracteres: 1320,
  caseSensitive: false,
  reaplicarAteEstabilizar: true,
};

export const LIMITE_CARACTERES_MIN = 50;
export const LIMITE_CARACTERES_MAX = 100000;
