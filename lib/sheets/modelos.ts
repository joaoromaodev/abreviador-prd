import { gerarId } from "@/lib/id";
import type { ModeloPRD } from "@/lib/types";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

const ABA = "Modelos";
const COLUNAS = ["id", "nome", "conteudo", "criadoEm", "atualizadoEm"];

function paraModelo(registro: Registro): ModeloPRD {
  return {
    id: registro.id,
    nome: registro.nome,
    conteudo: registro.conteudo,
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

export async function listarModelos(): Promise<ModeloPRD[]> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  return linhas.map(paraModelo).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export async function criarModelo(dados: { nome: string; conteudo: string }): Promise<ModeloPRD> {
  const id = gerarId();
  const agora = new Date().toISOString();
  // Literal inline (não uma variável pré-tipada como ModeloPRD) para que o TypeScript tipe
  // pelo contexto do parâmetro (Registro = Record<string, string>) sem reclamar de "index
  // signature" — ModeloPRD não declara uma.
  await adicionarLinha(ABA, COLUNAS, { id, nome: dados.nome, conteudo: dados.conteudo, criadoEm: agora, atualizadoEm: agora });
  return { id, nome: dados.nome, conteudo: dados.conteudo, criadoEm: agora, atualizadoEm: agora };
}

export async function atualizarModelo(
  id: string,
  dados: { nome: string; conteudo: string }
): Promise<ModeloPRD | null> {
  const agora = new Date().toISOString();
  const registro = await atualizarLinha(ABA, COLUNAS, id, {
    nome: dados.nome,
    conteudo: dados.conteudo,
    atualizadoEm: agora,
  });
  return registro ? paraModelo(registro) : null;
}

export async function removerModelo(id: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, id);
}
