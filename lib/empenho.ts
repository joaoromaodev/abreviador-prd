// Schema FIXO do bloco "Dados para Empenho" (setor CEO), guardado em `Contrato.dadosEmpenho`.
// É autocontido de propósito: não depende do tipo/template de PRD, então vale igual para contratos
// que geram PRD (CPED) e para os que existem só para empenho (sem tipo). Rótulos e ordem ficam aqui
// para a tela de cadastro e a tela de consulta usarem a MESMA definição.

export interface CampoEmpenho {
  /** Chave estável guardada em `dadosEmpenho`. */
  chave: string;
  rotulo: string;
  /** Campo de texto longo (usa textarea no formulário). */
  longo?: boolean;
  /** Dica de exemplo/uso mostrada no cadastro. */
  ajuda?: string;
}

// Núcleo de registro contratual (o que aparece nas planilhas de contrato) + classificação
// orçamentária que o SIAFE exige. Tudo opcional: cada contrato preenche o que fizer sentido.
export const CAMPOS_EMPENHO: readonly CampoEmpenho[] = [
  { chave: "credor", rotulo: "Credor (contratada / locador / município)" },
  { chave: "cnpj", rotulo: "CNPJ / CPF" },
  { chave: "processo", rotulo: "Nº do Processo" },
  { chave: "numContrato", rotulo: "Nº do Contrato / Acordo" },
  { chave: "modalidadeLicitacao", rotulo: "Modalidade de Licitação" },
  { chave: "esfera", rotulo: "Esfera" },
  { chave: "ugr", rotulo: "UGR (Unidade Gestora Responsável)" },
  { chave: "natdesp", rotulo: "Natureza da Despesa" },
  { chave: "pi", rotulo: "Plano Interno" },
  { chave: "acao", rotulo: "Ação" },
  { chave: "programatica", rotulo: "Funcional Programática" },
  { chave: "projatv", rotulo: "Projeto Atividade" },
  { chave: "produto", rotulo: "Produto" },
  { chave: "fonte", rotulo: "Fonte" },
  { chave: "objeto", rotulo: "Objeto do Contrato", longo: true },
] as const;

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
