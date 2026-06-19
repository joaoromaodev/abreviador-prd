import type { Configuracoes } from "./types";

export const STORAGE_KEYS = {
  palavras: "abreviador-prd:palavras",
  configuracoes: "abreviador-prd:configuracoes",
  modelos: "abreviador-prd:modelos",
  rascunho: "abreviador-prd:rascunho",
} as const;

export const CONFIG_PADRAO: Configuracoes = {
  limiteCaracteres: 1320,
  caseSensitive: false,
  reaplicarAteEstabilizar: true,
};

export const LIMITE_CARACTERES_MIN = 50;
export const LIMITE_CARACTERES_MAX = 100000;
