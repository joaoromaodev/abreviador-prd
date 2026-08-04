import { normalizarDadosEmpenho } from "@/lib/empenho";
import type { DadosContrato } from "@/lib/sheets/contratos";
import type { ModalidadeContrato } from "@/lib/types";

/** Normaliza o corpo de uma requisição em DadosContrato, ou devolve uma mensagem de erro de validação. */
export function lerCorpoContrato(corpo: unknown): DadosContrato | string {
  const dados = corpo as Record<string, unknown> | null;
  // tipoId é OPCIONAL: contrato sem tipo existe só para empenho (CEO), sem gerar PRD.
  const tipoId = String(dados?.tipoId ?? "").trim();
  const nome = String(dados?.nome ?? "").trim();
  if (!nome) return "Informe uma identificação para o contrato.";

  const temTermoAditivo = dados?.temTermoAditivo === true;
  const quantidadeBruta = Number(dados?.quantidadeTermosAditivos ?? 0);
  const quantidadeTermosAditivos =
    temTermoAditivo && Number.isFinite(quantidadeBruta) && quantidadeBruta > 0 ? Math.floor(quantidadeBruta) : 0;

  const vigenciaIndeterminada = dados?.vigenciaIndeterminada === true;
  const vigenciaInicio = dataIso(dados?.vigenciaInicio);
  // Prazo indeterminado não tem data de fim.
  const vigenciaFim = vigenciaIndeterminada ? "" : dataIso(dados?.vigenciaFim);

  const valores = normalizarValores(dados?.valores);
  const modalidades = lerModalidades(dados?.modalidades);
  const dadosEmpenho = normalizarDadosEmpenho(dados?.dadosEmpenho);

  return {
    tipoId,
    nome,
    temTermoAditivo,
    quantidadeTermosAditivos,
    vigenciaInicio,
    vigenciaFim,
    vigenciaIndeterminada,
    valores,
    modalidades,
    dadosEmpenho,
  };
}

/** Converte um mapa bruto de valores em Record<string, string>. */
function normalizarValores(bruto: unknown): Record<string, string> {
  const valoresBrutos = (bruto ?? {}) as Record<string, unknown>;
  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(valoresBrutos)) {
    valores[chave] = String(valor ?? "");
  }
  return valores;
}

/** Normaliza a lista de modalidades; descarta itens totalmente vazios (sem nome e sem valores). */
function lerModalidades(bruto: unknown): ModalidadeContrato[] {
  if (!Array.isArray(bruto)) return [];
  const modalidades: ModalidadeContrato[] = [];
  for (const item of bruto) {
    const registro = item as Record<string, unknown> | null;
    const nome = String(registro?.nome ?? "").trim();
    const valores = normalizarValores(registro?.valores);
    if (nome || Object.keys(valores).length > 0) modalidades.push({ nome, valores });
  }
  return modalidades;
}

/** Aceita só datas no formato ISO "YYYY-MM-DD"; qualquer outra coisa vira "" (vigência não informada). */
function dataIso(valor: unknown): string {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "";
}

/** Quais blocos do contrato o editor tem permissão de escrever (ver lib/setores.ts). */
export interface PermissoesContrato {
  /** Bloco PRD: tipoId, valores (campos do template) e modalidades (CPED). */
  prd: boolean;
  /** Bloco de Empenho: dadosEmpenho (CEO). */
  empenho: boolean;
}

/** Bloco PRD "zerado" — usado quando o editor não pode escrever no PRD e não há contrato anterior. */
const BLOCO_PRD_VAZIO = { tipoId: "", valores: {}, modalidades: [] as ModalidadeContrato[] };

/**
 * Autorização por BLOCO. Os campos-base (nome, vigência, termo aditivo) vêm sempre da `entrada`
 * (qualquer admin edita a base). Cada bloco setorial só é sobrescrito se o editor puder; senão
 * preserva o `atual` (edição) ou fica vazio (criação). Impede a CEO de mexer no PRD e vice-versa.
 */
export function aplicarPermissoesContrato(
  entrada: DadosContrato,
  atual: DadosContrato | null,
  permissoes: PermissoesContrato
): DadosContrato {
  const prd = permissoes.prd ? entrada : (atual ?? BLOCO_PRD_VAZIO);
  const empenho = permissoes.empenho ? entrada.dadosEmpenho : (atual?.dadosEmpenho ?? {});
  return {
    // Campos-base: sempre da entrada.
    nome: entrada.nome,
    temTermoAditivo: entrada.temTermoAditivo,
    quantidadeTermosAditivos: entrada.quantidadeTermosAditivos,
    vigenciaInicio: entrada.vigenciaInicio,
    vigenciaFim: entrada.vigenciaFim,
    vigenciaIndeterminada: entrada.vigenciaIndeterminada,
    // Bloco PRD (CPED).
    tipoId: prd.tipoId,
    valores: prd.valores,
    modalidades: prd.modalidades,
    // Bloco Empenho (CEO).
    dadosEmpenho: empenho,
  };
}
