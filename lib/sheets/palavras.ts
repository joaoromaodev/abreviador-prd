import { gerarId } from "@/lib/id";
import type { PalavraAbreviacao } from "@/lib/types";
import { adicionarLinha, atualizarLinha, lerLinhas, removerLinha, type Registro } from "./table";

const ABA = "Palavras";
const COLUNAS = ["id", "palavra", "abreviacao"];

function paraPalavra(registro: Registro): PalavraAbreviacao {
  return { id: registro.id, palavra: registro.palavra, abreviacao: registro.abreviacao };
}

export async function listarPalavras(): Promise<PalavraAbreviacao[]> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  return linhas.map(paraPalavra).sort((a, b) => a.palavra.localeCompare(b.palavra, "pt-BR"));
}

export async function criarPalavra(dados: { palavra: string; abreviacao: string }): Promise<PalavraAbreviacao> {
  const id = gerarId();
  // Literal inline (não uma variável pré-tipada como PalavraAbreviacao) para que o TypeScript
  // tipe pelo contexto do parâmetro (Registro = Record<string, string>) sem reclamar de
  // "index signature" — PalavraAbreviacao não declara uma.
  await adicionarLinha(ABA, COLUNAS, { id, palavra: dados.palavra, abreviacao: dados.abreviacao });
  return { id, palavra: dados.palavra, abreviacao: dados.abreviacao };
}

export async function atualizarPalavra(
  id: string,
  dados: { palavra: string; abreviacao: string }
): Promise<PalavraAbreviacao | null> {
  const registro = await atualizarLinha(ABA, COLUNAS, id, { palavra: dados.palavra, abreviacao: dados.abreviacao });
  return registro ? paraPalavra(registro) : null;
}

export async function removerPalavra(id: string): Promise<boolean> {
  return removerLinha(ABA, COLUNAS, id);
}
