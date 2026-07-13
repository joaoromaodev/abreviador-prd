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
export const MODALIDADES_TERCEIRIZADA = ["Administrativo", "Ensino Médio", "Ensino Fundamental"] as const;

// Tipos de licitação e o único que NÃO leva número (Inexigibilidade).
export const TIPOS_LICITACAO = ["Pregão Eletrônico", "Dispensa de Licitação", "Inexigibilidade"] as const;
export const LICITACAO_SEM_NUMERO = "Inexigibilidade";

// Tipo de PRD semeado automaticamente quando a aba "Tipos" da planilha está vazia,
// para o time já começar com o modelo de Locação de Imóveis pronto (e editável na tela).
export const TIPO_LOCACAO_PADRAO = {
  nome: "Locação de Imóveis",
  template:
    "ESFERA:1-ORCAMENTO FISCAL UGR:160101, PLANO INTERNO:<<pi>>, ACAO:<<açao>>, FUNCIONAL PROGRAMATICA:<<programatica>>, PROJETO ATIVIDADE:<<projatv>>, PRODUTO:<<produto>>, NATUREZA DE DESPESA: {natdesp}, FONTE:<<fonte>>; PAGAMENTO REFERENTE AO CONTRATO Nº {contrato} <<termo>>; {modalidade}; PAGAMENTO REFERENTE AO PERIODO DE <<periodo>>; {textotermoadtivo}; OBJETO DO CONTRATO: {objdocontrato}.",
} as const;
