// Motor de templates dos modelos de PRD.
//
// Um template é um texto com dois tipos de marcador:
//   <<campo>>  -> campo MENSAL: preenchido a cada PRD (muda todo mês).
//   {campo}    -> campo do CONTRATO: cadastrado e amarrado ao contrato.
//
// Tokens RESERVADOS, com comportamento ligado ao termo aditivo do contrato:
//   <<termo>>           -> derivado do contrato. Se o contrato tem termo aditivo,
//                          vira "(Nº T.A)" (ex.: "(8º T.A)"); senão, é removido.
//   {textocontrato} / {textotermoadtivo}
//                       -> usa UM ou OUTRO (nunca os dois): sem termo aditivo, fica só o
//                          texto do contrato; com termo aditivo, fica só o texto do T.A.
//                          O separador " / " e o lado não usado são removidos.

export const TOKEN_TERMO = "termo";
export const TOKEN_TEXTO_CONTRATO = "textocontrato";
export const TOKEN_TEXTO_TA = "textotermoadtivo";

const RE_MENSAL = /<<\s*([^<>]+?)\s*>>/g;
const RE_CONTRATO = /\{\s*([^{}]+?)\s*\}/g;

export interface CamposTemplate {
  /** Campos `<<...>>` perguntados a cada PRD (sem o token reservado `termo`). */
  mensais: string[];
  /** Campos `{...}` amarrados ao contrato (inclui `textotermoadtivo`, se houver). */
  contrato: string[];
  /** O template usa o token reservado `<<termo>>`? */
  usaTermo: boolean;
}

/** Lê um template e devolve, sem repetições e na ordem de aparição, os campos que ele usa. */
export function extrairCampos(template: string): CamposTemplate {
  const mensais: string[] = [];
  const contrato: string[] = [];
  let usaTermo = false;

  for (const correspondencia of template.matchAll(RE_MENSAL)) {
    const nome = correspondencia[1].trim();
    if (nome === TOKEN_TERMO) {
      usaTermo = true;
      continue;
    }
    if (!mensais.includes(nome)) mensais.push(nome);
  }

  for (const correspondencia of template.matchAll(RE_CONTRATO)) {
    const nome = correspondencia[1].trim();
    if (!contrato.includes(nome)) contrato.push(nome);
  }

  return { mensais, contrato, usaTermo };
}

export interface DadosRender {
  valoresMensais: Record<string, string>;
  valoresContrato: Record<string, string>;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
}

/** Remove espaços duplicados e espaços antes de pontuação que sobram quando um campo fica vazio. */
function limpar(texto: string): string {
  return texto
    .replace(/ {2,}/g, " ")
    .replace(/ +([;,.])/g, "$1")
    .trim();
}

/** Monta o texto final substituindo os marcadores pelos valores e aplicando as regras do termo aditivo. */
export function renderizar(template: string, dados: DadosRender): string {
  let texto = template;
  const valoresContrato = { ...dados.valoresContrato };

  if (dados.temTermoAditivo) {
    // Com termo aditivo: monta o "(Nº T.A)" e usa só o texto do T.A. (remove "{textocontrato} / ").
    valoresContrato[TOKEN_TEXTO_CONTRATO] = "";
    texto = texto.replace(/<<\s*termo\s*>>/g, `(${dados.quantidadeTermosAditivos}º T.A)`);
    texto = texto.replace(/\{\s*textocontrato\s*\}\s*\/\s*/g, "");
  } else {
    // Sem termo aditivo: some o "<<termo>>" (com o espaço antes) e usa só o texto do contrato
    // (remove " / {textotermoadtivo}").
    valoresContrato[TOKEN_TEXTO_TA] = "";
    texto = texto.replace(/\s*<<\s*termo\s*>>/g, "");
    texto = texto.replace(/\s*\/\s*\{\s*textotermoadtivo\s*\}/g, "");
  }

  texto = texto.replace(RE_MENSAL, (_correspondencia, nome: string) => dados.valoresMensais[nome.trim()] ?? "");
  texto = texto.replace(RE_CONTRATO, (_correspondencia, nome: string) => valoresContrato[nome.trim()] ?? "");

  return limpar(texto);
}

const ROTULOS: Record<string, string> = {
  pi: "Plano Interno",
  açao: "Ação",
  acao: "Ação",
  programatica: "Funcional Programática",
  projatv: "Projeto Atividade",
  produto: "Produto",
  fonte: "Fonte",
  periodo: "Período",
  natdesp: "Natureza de Despesa",
  contrato: "Nº do Contrato",
  modalidade: "Modalidade",
  textocontrato: "Texto do Contrato",
  textotermoadtivo: "Texto do Termo Aditivo",
  objdocontrato: "Objeto do Contrato",
};

/** Rótulo amigável para um campo; cai no próprio nome do token quando não há um cadastrado. */
export function rotuloCampo(nome: string): string {
  return ROTULOS[nome] ?? nome;
}
