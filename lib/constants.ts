import type { Configuracoes } from "./types";

export const STORAGE_KEYS = {
  // Único uso restante do localStorage: passar o texto gerado na aba "Modelos de PRD" pra caixa de
  // texto da aba "Abreviador" ao navegar entre as duas. Palavras, tipos, contratos e
  // configurações ficam na planilha (lib/sheets/*), compartilhados pela equipe.
  rascunho: "abreviador-prd:rascunho",
} as const;

export const CONFIG_PADRAO: Configuracoes = {
  limiteCaracteres: 1320,
  caseSensitive: false,
  reaplicarAteEstabilizar: true,
};

export const LIMITE_CARACTERES_MIN = 50;
export const LIMITE_CARACTERES_MAX = 100000;

// Opções fixas do cadastro de modalidades (Terceirizada). Ficam aqui para serem fáceis de ajustar.
export const MODALIDADES_TERCEIRIZADA = [
  "Administrativo",
  "Ensino Médio",
  "Ensino Fundamental",
  "Prestação de Serviço",
] as const;

// Modalidade que NÃO é impressa no PRD: existe só para separar os valores no cadastro do contrato.
// Quando escolhida, o trecho "MODALIDADE: [[modalidade]]" some inteiro do texto (rótulo incluído).
export const MODALIDADE_NAO_IMPRESSA = "Prestação de Serviço";

// Modalidades de licitação disponíveis no cadastro de contrato.
export const TIPOS_LICITACAO = [
  "Pregão Eletrônico",
  "Dispensa de Licitação",
  "Inexigibilidade",
  "Concurso",
  "Convite",
  "Tomada de Preços",
  "Concorrência",
  "Não Aplicável",
  "Leilão",
  "Diálogo Competitivo",
] as const;

// Modalidades que NÃO levam número (a caixa de número some no formulário).
export const LICITACOES_SEM_NUMERO = ["Inexigibilidade", "Não Aplicável"] as const;

/** True se a modalidade de licitação não leva número. */
export function licitacaoSemNumero(tipo: string): boolean {
  return (LICITACOES_SEM_NUMERO as readonly string[]).includes(tipo);
}

// Tipo de PRD semeado automaticamente quando a aba "Tipos" da planilha está vazia,
// para o time já começar com o modelo de Locação de Imóveis pronto (e editável na tela).
export const TIPO_LOCACAO_PADRAO = {
  nome: "Locação de Imóveis",
  template:
    "ESFERA:1-ORCAMENTO FISCAL UGR:160101, PLANO INTERNO:<<pi>>, ACAO:<<açao>>, FUNCIONAL PROGRAMATICA:<<programatica>>, PROJETO ATIVIDADE:<<projatv>>, PRODUTO:<<produto>>, NATUREZA DE DESPESA: {natdesp}, FONTE:<<fonte>>; PAGAMENTO REFERENTE AO CONTRATO Nº {contrato} <<termo>>; {modalidade}; PAGAMENTO REFERENTE AO PERIODO DE <<periodo>>; {textotermoadtivo}; OBJETO DO CONTRATO: {objdocontrato}.",
} as const;
