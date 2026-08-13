// Schema FIXO do bloco "Dados para Empenho" (setor CEO), guardado em `Contrato.dadosEmpenho`.
// É autocontido de propósito: não depende do tipo/template de PRD, então vale igual para contratos
// que geram PRD (CPED) e para os que existem só para empenho (sem tipo).
//
// A ordem e o agrupamento seguem as 3 ETAPAS da tela de empenho do SIAFE (Geral → Informação
// Adicional → Item de Empenho), para que a consulta e o cadastro espelhem o passo a passo do
// sistema. Cadastro e consulta usam a MESMA definição — mexa só aqui.

export interface CampoEmpenho {
  /** Chave estável guardada em `dadosEmpenho`. */
  chave: string;
  rotulo: string;
  /** Campo de texto longo (usa textarea no formulário). */
  longo?: boolean;
  /** Dica de exemplo/uso mostrada no cadastro. */
  ajuda?: string;
  /**
   * Reexibição de um valor já digitado em outra etapa (mesma `chave`). O SIAFE pede o mesmo dado
   * em telas diferentes, então a CONSULTA mostra o valor nas duas etapas, mas o CADASTRO tem só um
   * campo (as etapas com `repetido` não geram input no formulário).
   */
  repetido?: boolean;
}

/** Bloco de campos dentro de uma etapa; `titulo` opcional para subdividir (ex.: "Dados do Registro"). */
export interface GrupoEmpenho {
  titulo?: string;
  campos: readonly CampoEmpenho[];
}

/** Uma das etapas do SIAFE. */
export interface SecaoEmpenho {
  /** Número da etapa no SIAFE (1, 2, 3). */
  numero: number;
  /** Id estável (para keys e accordion). */
  id: string;
  titulo: string;
  grupos: readonly GrupoEmpenho[];
}

// Etapas na ordem exata do SIAFE. Tudo opcional: cada contrato preenche o que fizer sentido.
export const SECOES_EMPENHO: readonly SecaoEmpenho[] = [
  {
    numero: 1,
    id: "geral",
    titulo: "Geral",
    grupos: [
      {
        campos: [
          { chave: "eventosContabeis", rotulo: "Eventos Contábeis" },
          { chave: "unidadeGestora", rotulo: "Unidade Gestora" },
          { chave: "modalidadeLicitacao", rotulo: "Modalidade de Licitação" },
          { chave: "credor", rotulo: "Credor (nome)" },
          {
            chave: "cnpj",
            rotulo: "Credor — CNPJ / CPF",
            ajuda: 'É o que vai no campo "Credor" do SIAFE.',
          },
          { chave: "objeto", rotulo: "Objeto do Contrato", longo: true },
        ],
      },
    ],
  },
  {
    numero: 2,
    id: "info-adicional",
    titulo: "Informação Adicional",
    grupos: [
      {
        campos: [
          { chave: "modalidade", rotulo: "Modalidade" },
          { chave: "referenciaLegal", rotulo: "Referência Legal" },
          { chave: "processo", rotulo: "Número do Processo" },
          { chave: "numContrato", rotulo: "Contrato" },
          { chave: "convenio", rotulo: "Convênio" },
          { chave: "numProcedimentoLicitatorio", rotulo: "Número do Procedimento Licitatório" },
        ],
      },
    ],
  },
  {
    numero: 3,
    id: "item-empenho",
    titulo: "Item de Empenho",
    grupos: [
      {
        titulo: "Dados do Registro",
        campos: [
          // Reexibe a Unidade Gestora da Etapa 1 (o SIAFE pede o mesmo valor de novo aqui).
          { chave: "unidadeGestora", rotulo: "Unidade Gestora", repetido: true },
          { chave: "pi", rotulo: "Plano Interno" },
          { chave: "natdesp", rotulo: "Natureza da Despesa" },
          { chave: "fonte", rotulo: "Fonte de Recurso" },
          { chave: "detalhamentoFR", rotulo: "Detalhamento FR (Fonte de Recurso)" },
        ],
      },
      {
        campos: [
          { chave: "acao", rotulo: "Ação Detalhada" },
          { chave: "ugr", rotulo: "Unidade Gestora Responsável" },
        ],
      },
    ],
  },
];

/**
 * Campos únicos por `chave`, achatados na ordem das etapas. Reexibições (`repetido`) apontam para
 * uma chave já presente, então entram só uma vez — é a lista usada para salvar/normalizar/cadastrar.
 */
const TODOS_CAMPOS = SECOES_EMPENHO.flatMap((s) => s.grupos.flatMap((g) => g.campos));
export const CAMPOS_EMPENHO: readonly CampoEmpenho[] = TODOS_CAMPOS.filter(
  (campo, i) => TODOS_CAMPOS.findIndex((o) => o.chave === campo.chave) === i
);

export const CHAVES_EMPENHO: readonly string[] = CAMPOS_EMPENHO.map((c) => c.chave);

/** Mantém em `dadosEmpenho` só as chaves do schema, cada valor normalizado para string aparada. */
export function normalizarDadosEmpenho(bruto: unknown): Record<string, string> {
  const origem = (bruto ?? {}) as Record<string, unknown>;
  const saida: Record<string, string> = {};
  for (const { chave } of CAMPOS_EMPENHO) {
    const valor = String(origem[chave] ?? "").trim();
    if (valor) saida[chave] = valor;
  }
  return saida;
}

/** True se o contrato tem algum dado de empenho preenchido. */
export function temDadosEmpenho(dados: Record<string, string> | undefined): boolean {
  return Boolean(dados) && Object.values(dados as Record<string, string>).some((v) => v.trim() !== "");
}
