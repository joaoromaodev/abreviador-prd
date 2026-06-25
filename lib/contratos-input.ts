import type { DadosContrato } from "@/lib/sheets/contratos";

/** Normaliza o corpo de uma requisição em DadosContrato, ou devolve uma mensagem de erro de validação. */
export function lerCorpoContrato(corpo: unknown): DadosContrato | string {
  const dados = corpo as Record<string, unknown> | null;
  const tipoId = String(dados?.tipoId ?? "").trim();
  const nome = String(dados?.nome ?? "").trim();
  if (!tipoId) return "Selecione o tipo do contrato.";
  if (!nome) return "Informe uma identificação para o contrato.";

  const temTermoAditivo = dados?.temTermoAditivo === true;
  const quantidadeBruta = Number(dados?.quantidadeTermosAditivos ?? 0);
  const quantidadeTermosAditivos =
    temTermoAditivo && Number.isFinite(quantidadeBruta) && quantidadeBruta > 0 ? Math.floor(quantidadeBruta) : 0;

  const vigenciaInicio = dataIso(dados?.vigenciaInicio);
  const vigenciaFim = dataIso(dados?.vigenciaFim);

  const valoresBrutos = (dados?.valores ?? {}) as Record<string, unknown>;
  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(valoresBrutos)) {
    valores[chave] = String(valor ?? "");
  }

  return { tipoId, nome, temTermoAditivo, quantidadeTermosAditivos, vigenciaInicio, vigenciaFim, valores };
}

/** Aceita só datas no formato ISO "YYYY-MM-DD"; qualquer outra coisa vira "" (vigência não informada). */
function dataIso(valor: unknown): string {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "";
}
