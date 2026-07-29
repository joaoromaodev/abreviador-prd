import { gerarId } from "@/lib/id";
import type { Contrato, ModalidadeContrato } from "@/lib/types";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

const ABA = "Contratos";
// Colunas novas entram sempre por ÚLTIMO de propósito: preservam a posição das colunas já gravadas
// nas planilhas existentes (linhas antigas simplesmente não têm a coluna e viram valor vazio).
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
  "modalidades",
  "vigenciaIndeterminada",
  "dadosEmpenho",
];

export interface DadosContrato {
  tipoId: string;
  nome: string;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
  vigenciaInicio: string;
  vigenciaFim: string;
  vigenciaIndeterminada: boolean;
  valores: Record<string, string>;
  modalidades: ModalidadeContrato[];
  dadosEmpenho: Record<string, string>;
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

function lerModalidades(bruto: string): ModalidadeContrato[] {
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => {
        const valores = item.valores;
        return {
          nome: String(item.nome ?? ""),
          valores: valores && typeof valores === "object" ? (valores as Record<string, string>) : {},
        };
      });
  } catch {
    return [];
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
    vigenciaIndeterminada: registro.vigenciaIndeterminada === "true",
    valores: lerValores(registro.valores),
    modalidades: lerModalidades(registro.modalidades),
    dadosEmpenho: lerValores(registro.dadosEmpenho),
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
    vigenciaIndeterminada: String(dados.vigenciaIndeterminada),
    valores: JSON.stringify(dados.valores),
    modalidades: JSON.stringify(dados.modalidades ?? []),
    dadosEmpenho: JSON.stringify(dados.dadosEmpenho ?? {}),
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
