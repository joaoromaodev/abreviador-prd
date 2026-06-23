import { TIPO_LOCACAO_PADRAO } from "@/lib/constants";
import { gerarId } from "@/lib/id";
import type { TipoPRD } from "@/lib/types";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

const ABA = "Tipos";
const COLUNAS = ["id", "nome", "template", "criadoEm", "atualizadoEm"];

function paraTipo(registro: Registro): TipoPRD {
  return {
    id: registro.id,
    nome: registro.nome,
    template: registro.template,
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

export async function listarTipos(): Promise<TipoPRD[]> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  // Semeia o tipo de Locação de Imóveis na primeira vez (aba vazia), para o time já começar com algo pronto.
  if (linhas.length === 0) {
    const semeado = await criarTipo(TIPO_LOCACAO_PADRAO);
    return [semeado];
  }
  return linhas.map(paraTipo).sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function criarTipo(dados: { nome: string; template: string }): Promise<TipoPRD> {
  const id = gerarId();
  const agora = new Date().toISOString();
  await adicionarLinha(ABA, COLUNAS, {
    id,
    nome: dados.nome,
    template: dados.template,
    criadoEm: agora,
    atualizadoEm: agora,
  });
  return { id, nome: dados.nome, template: dados.template, criadoEm: agora, atualizadoEm: agora };
}

export async function atualizarTipo(
  id: string,
  dados: { nome: string; template: string }
): Promise<TipoPRD | null> {
  const agora = new Date().toISOString();
  const registro = await atualizarLinha(ABA, COLUNAS, id, {
    nome: dados.nome,
    template: dados.template,
    atualizadoEm: agora,
  });
  return registro ? paraTipo(registro) : null;
}

export async function removerTipo(id: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, id);
}
