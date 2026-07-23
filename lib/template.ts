// Motor de templates dos modelos de PRD.
//
// Um template é um texto com três tipos de marcador:
//   <<campo>>  -> campo MENSAL: preenchido a cada PRD (muda todo mês).
//   {campo}    -> campo do CONTRATO: cadastrado uma vez e amarrado ao contrato.
//   [[campo]]  -> campo por MODALIDADE: muda dentro do mesmo contrato conforme a modalidade
//                 escolhida (ex.: Terceirizada — Administrativo / Ensino Médio / Ensino Fundamental).
//
// Tokens RESERVADOS, com comportamento ligado ao termo aditivo do contrato:
//   <<termo>>           -> derivado do contrato. Se o contrato tem termo aditivo,
//                          vira "(Nº T.A)" (ex.: "(8º T.A)"); senão, é removido.
//   {textocontrato} / {textotermoadtivo}
//                       -> usa UM ou OUTRO (nunca os dois): sem termo aditivo, fica só o
//                          texto do contrato; com termo aditivo, fica só o texto do T.A.
//                          O separador " / " e o lado não usado são removidos.
//   [[modalidade]]      -> derivado da modalidade escolhida: vira o NOME dela (ex.: "Ensino Médio").
//                          Na modalidade NÃO impressa (MODALIDADE_NAO_IMPRESSA, hoje "Prestação de
//                          Serviço"), o token some junto com o rótulo que vem antes dele — o texto
//                          não sai com "MODALIDADE:" sobrando.

import { MODALIDADE_NAO_IMPRESSA } from "./constants";

export const TOKEN_TERMO = "termo";
export const TOKEN_TEXTO_CONTRATO = "textocontrato";
export const TOKEN_TEXTO_TA = "textotermoadtivo";
export const TOKEN_MODALIDADE = "modalidade";

const RE_MENSAL = /<<\s*([^<>]+?)\s*>>/g;
const RE_CONTRATO = /\{\s*([^{}]+?)\s*\}/g;
const RE_MODALIDADE = /\[\[\s*([^[\]]+?)\s*\]\]/g;
// Rótulo colado no token reservado (ex.: "MODALIDADE: [[modalidade]]"): usado para apagar os dois
// de uma vez na modalidade não impressa, senão sobraria o rótulo sem valor nenhum depois.
const RE_ROTULO_MODALIDADE = /[^\s;,]+\s*:\s*\[\[\s*modalidade\s*\]\]/g;

export interface CamposTemplate {
  /** Campos `<<...>>` perguntados a cada PRD (sem o token reservado `termo`). */
  mensais: string[];
  /** Campos `{...}` amarrados ao contrato (inclui `textotermoadtivo`, se houver). */
  contrato: string[];
  /** Campos `[[...]]` preenchidos por modalidade (sem o token reservado `modalidade`). */
  modalidades: string[];
  /** O template usa o token reservado `<<termo>>`? */
  usaTermo: boolean;
  /** O template usa modalidades? (qualquer `[[...]]`, inclusive o reservado `[[modalidade]]`). */
  usaModalidade: boolean;
}

/** Lê um template e devolve, sem repetições e na ordem de aparição, os campos que ele usa. */
export function extrairCampos(template: string): CamposTemplate {
  const mensais: string[] = [];
  const contrato: string[] = [];
  const modalidades: string[] = [];
  let usaTermo = false;
  let usaModalidade = false;

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

  for (const correspondencia of template.matchAll(RE_MODALIDADE)) {
    usaModalidade = true;
    const nome = correspondencia[1].trim();
    if (nome === TOKEN_MODALIDADE) continue;
    if (!modalidades.includes(nome)) modalidades.push(nome);
  }

  return { mensais, contrato, modalidades, usaTermo, usaModalidade };
}

export interface DadosRender {
  valoresMensais: Record<string, string>;
  valoresContrato: Record<string, string>;
  /** Valores dos campos `[[...]]` da modalidade escolhida (vazio quando o tipo não usa modalidades). */
  valoresModalidade?: Record<string, string>;
  /** Nome da modalidade escolhida — preenche o token reservado `[[modalidade]]`. */
  nomeModalidade?: string;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
}

/** Limpa artefatos de campos vazios: segmentos ";" vazios, espaços duplicados e espaços antes de pontuação. */
function limpar(texto: string): string {
  return texto
    // Campo condicional ausente (ex.: termo aditivo) deixa um segmento vazio entre ";": colapsa em um só.
    .replace(/;(?:\s*;)+/g, ";")
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

  const valoresModalidade = dados.valoresModalidade ?? {};
  const imprimeModalidade = dados.nomeModalidade !== MODALIDADE_NAO_IMPRESSA;

  if (!imprimeModalidade) {
    // Modalidade que não vai pro texto: tira o rótulo + o token juntos. O ";" que sobra vazio
    // é colapsado no limpar(), igual ao que acontece com o termo aditivo ausente.
    texto = texto.replace(RE_ROTULO_MODALIDADE, "");
  }

  texto = texto.replace(RE_MODALIDADE, (_correspondencia, nome: string) => {
    const chave = nome.trim();
    // Só o NOME da modalidade some; os demais campos `[[...]]` dela continuam valendo normalmente.
    if (chave === TOKEN_MODALIDADE) return imprimeModalidade ? dados.nomeModalidade ?? "" : "";
    return valoresModalidade[chave] ?? "";
  });

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
  tipolicitacao: "Tipo de Licitação",
  numlicitacao: "Nº da Licitação",
  licitacao: "Licitação",
  textocontrato: "Texto do Contrato",
  textotermoadtivo: "Texto do Termo Aditivo",
  objdocontrato: "Objeto do Contrato",
};

/** Rótulo amigável para um campo; cai no próprio nome do token quando não há um cadastrado. */
export function rotuloCampo(nome: string): string {
  return ROTULOS[nome] ?? nome;
}
