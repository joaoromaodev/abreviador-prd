import { gerarId } from "@/lib/id";
import type { Contrato } from "@/lib/types";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

const ABA = "Contratos";
const COLUNAS = [
  "id",
  "tipoId",
  "nome",
  "temTermoAditivo",
  "quantidadeTermosAditivos",
  "vigenciaInicio",
  "vigenciaFim",
  "valores",
  "criadoEm",
  "atualizadoEm",
];

export interface DadosContrato {
  tipoId: string;
  nome: string;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
  vigenciaInicio: string;
  vigenciaFim: string;
  valores: Record<string, string>;
}

function lerValores(bruto: string): Record<string, string> {
  if (!bruto) return {};
  try {
    const objeto = JSON.parse(bruto);
    return objeto && typeof objeto === "object" ? (objeto as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function paraContrato(registro: Registro): Contrato {
  const quantidade = Number(registro.quantidadeTermosAditivos);
  return {
    id: registro.id,
    tipoId: registro.tipoId,
    nome: registro.nome,
    temTermoAditivo: registro.temTermoAditivo === "true",
    quantidadeTermosAditivos: Number.isFinite(quantidade) ? quantidade : 0,
    vigenciaInicio: registro.vigenciaInicio,
    vigenciaFim: registro.vigenciaFim,
    valores: lerValores(registro.valores),
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

function paraCampos(dados: DadosContrato): Registro {
  return {
    tipoId: dados.tipoId,
    nome: dados.nome,
    temTermoAditivo: String(dados.temTermoAditivo),
    quantidadeTermosAditivos: String(dados.quantidadeTermosAditivos),
    vigenciaInicio: dados.vigenciaInicio,
    vigenciaFim: dados.vigenciaFim,
    valores: JSON.stringify(dados.valores),
  };
}

export async function listarContratos(): Promise<Contrato[]> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  return linhas.map(paraContrato).sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function criarContrato(dados: DadosContrato): Promise<Contrato> {
  const id = gerarId();
  const agora = new Date().toISOString();
  await adicionarLinha(ABA, COLUNAS, { id, ...paraCampos(dados), criadoEm: agora, atualizadoEm: agora });
  return { id, ...dados, criadoEm: agora, atualizadoEm: agora };
}

export async function atualizarContrato(id: string, dados: DadosContrato): Promise<Contrato | null> {
  const agora = new Date().toISOString();
  const registro = await atualizarLinha(ABA, COLUNAS, id, { ...paraCampos(dados), atualizadoEm: agora });
  return registro ? paraContrato(registro) : null;
}

export async function removerContrato(id: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, id);
}
