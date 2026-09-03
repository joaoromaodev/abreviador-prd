import type { Configuracoes, PalavraAbreviacao } from "./types";

type OpcoesAbreviacao = Pick<Configuracoes, "caseSensitive" | "reaplicarAteEstabilizar">;

const MAX_ITERACOES_REAPLICACAO = 5;

/** Limite de \p{L}/\p{N} antes/depois do trecho casado, para não abreviar pedaços de outras palavras. */
const FRONTEIRA_ANTES = "(?<![\\p{L}\\p{N}_])";
const FRONTEIRA_DEPOIS = "(?![\\p{L}\\p{N}_])";

function escaparRegExp(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Quebra a entrada em tokens e os rejunta com \s+, permitindo casar frases ("São Paulo") mesmo com espaçamento irregular no texto de origem. */
function construirPadrao(palavra: string): string {
  return palavra
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escaparRegExp)
    .join("\\s+");
}

/**
 * Uma única regex com um grupo nomeado por entrada (g0, g1, ...), unidas por alternância.
 * Usar uma regex combinada — em vez de um `.replace` por entrada, encadeados — garante que
 * cada passada escaneia o texto ORIGINAL uma única vez: a abreviação de uma entrada não pode
 * ser "vista" e re-abreviada por outra entrada na mesma passada (isso só acontece entre
 * passadas, quando `reaplicarAteEstabilizar` está ligado).
 */
function construirRegexCombinada(entradas: PalavraAbreviacao[], caseSensitive: boolean): RegExp {
  const alternativas = entradas
    .map((entrada, indice) => `(?<g${indice}>${FRONTEIRA_ANTES}${construirPadrao(entrada.palavra)}${FRONTEIRA_DEPOIS})`)
    .join("|");
  const flags = caseSensitive ? "gu" : "giu";
  return new RegExp(alternativas, flags);
}

/** Decide a capitalização da abreviação com base em como a palavra original foi escrita no texto. */
function ajustarCapitalizacao(trechoOriginal: string, abreviacao: string): string {
  const letras = trechoOriginal.replace(/[^\p{L}]/gu, "");
  if (!letras) return abreviacao;

  const ehTodaMaiuscula = letras.length > 1 && letras === letras.toUpperCase() && letras !== letras.toLowerCase();
  if (ehTodaMaiuscula) {
    return abreviacao.toUpperCase();
  }

  const primeiraLetra = trechoOriginal.trim().charAt(0);
  const ehCapitalizada = primeiraLetra && primeiraLetra === primeiraLetra.toUpperCase() && primeiraLetra !== primeiraLetra.toLowerCase();
  if (ehCapitalizada) {
    return abreviacao.charAt(0).toUpperCase() + abreviacao.slice(1);
  }

  return abreviacao;
}

/**
 * Substitui, no texto, cada palavra/frase cadastrada pela sua abreviação.
 * Casamento é por fronteira de token (não casa substrings de outras palavras) e as entradas
 * mais longas são aplicadas primeiro, para que frases como "Recursos Humanos" tenham
 * prioridade sobre uma entrada isolada "Recursos".
 */
export function aplicarAbreviacoes(
  texto: string,
  dicionario: PalavraAbreviacao[],
  opcoes: OpcoesAbreviacao
): string {
  if (!texto) return texto;

  const entradasValidas = dicionario
    .filter((entrada) => entrada.palavra.trim().length > 0 && entrada.abreviacao.trim().length > 0)
    .sort((a, b) => b.palavra.trim().length - a.palavra.trim().length);

  if (entradasValidas.length === 0) return texto;

  const regexCombinada = construirRegexCombinada(entradasValidas, opcoes.caseSensitive);

  function aplicarUmaPassada(entradaTexto: string): string {
    regexCombinada.lastIndex = 0;
    return entradaTexto.replace(regexCombinada, (trechoOriginal, ...resto) => {
      const grupos = resto[resto.length - 1] as Record<string, string | undefined>;
      const indice = entradasValidas.findIndex((_, i) => grupos[`g${i}`] !== undefined);
      if (indice === -1) return trechoOriginal;
      const abreviacao = entradasValidas[indice].abreviacao;
      return opcoes.caseSensitive ? abreviacao : ajustarCapitalizacao(trechoOriginal, abreviacao);
    });
  }

  let resultado = texto;
  const maxIteracoes = opcoes.reaplicarAteEstabilizar ? MAX_ITERACOES_REAPLICACAO : 1;

  for (let iteracao = 0; iteracao < maxIteracoes; iteracao++) {
    const novoResultado = aplicarUmaPassada(resultado);
    if (novoResultado === resultado) break;
    resultado = novoResultado;
  }

  return resultado;
}

/**
 * Remove acentos e cedilha do texto, preservando maiúsculas/minúsculas: á→a, ã→a, é→e, ô→o, ü→u,
 * ç→c, Ç→C. Usado como passo FINAL do abreviador (o texto do PRD não deve levar esses caracteres).
 * Aplicado só depois de abreviar, para que entradas acentuadas ("São Paulo") ainda casem.
 */
export function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export interface ResultadoLimite {
  cabe: boolean;
  tamanho: number;
  limite: number;
  /** Quantos caracteres ainda precisam ser cortados para caber no limite (0 se já cabe). */
  excedente: number;
}

export function verificarLimite(texto: string, limite: number): ResultadoLimite {
  const tamanho = texto.length;
  const cabe = tamanho <= limite;
  return {
    cabe,
    tamanho,
    limite,
    excedente: cabe ? 0 : tamanho - limite,
  };
}

/** Divide o texto em pedaços de até `tamanho` caracteres cada (o último pode ser menor). */
export function dividirEmPedacos(texto: string, tamanho: number): string[] {
  if (tamanho <= 0 || texto.length === 0) return [texto];

  const pedacos: string[] = [];
  for (let i = 0; i < texto.length; i += tamanho) {
    pedacos.push(texto.slice(i, i + tamanho));
  }
  return pedacos;
}
