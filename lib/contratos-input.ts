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

  const valoresBrutos = (dados?.valores ?? {}) as Record<string, unknown>;
  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(valoresBrutos)) {
    valores[chave] = String(valor ?? "");
  }

  return { tipoId, nome, temTermoAditivo, quantidadeTermosAditivos, valores };
}
