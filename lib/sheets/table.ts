import { obterSheets, obterSpreadsheetId } from "./client";

export type Registro = Record<string, string>;

/** Converte um índice de coluna 1-based em letra de coluna do Sheets (1 -> A, 27 -> AA, ...). */
function letraColuna(indice: number): string {
  let n = indice;
  let resultado = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    resultado = String.fromCharCode(65 + resto) + resultado;
    n = Math.floor((n - 1) / 26);
  }
  return resultado;
}

async function obterAba(nomeAba: string) {
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const metadados = await sheets.spreadsheets.get({ spreadsheetId });
  return metadados.data.sheets?.find((aba) => aba.properties?.title === nomeAba) ?? null;
}

/** Garante que a aba existe e que a linha 1 tem o cabeçalho esperado, criando o que faltar. */
async function garantirTabela(nomeAba: string, colunas: string[]): Promise<void> {
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const aba = await obterAba(nomeAba);

  if (!aba) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: nomeAba } } }] },
    });
  }

  const ultimaColuna = letraColuna(colunas.length);
  const cabecalho = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${nomeAba}!A1:${ultimaColuna}1`,
  });

  const semCabecalho = !cabecalho.data.values || cabecalho.data.values.length === 0;
  if (semCabecalho) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${nomeAba}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [colunas] },
    });
  }
}

function linhasParaRegistros(linhas: unknown[][], colunas: string[]): Registro[] {
  return linhas
    .filter((linha) => linha.some((valor) => String(valor ?? "").trim() !== ""))
    .map((linha) => {
      const registro: Registro = {};
      colunas.forEach((coluna, indice) => {
        registro[coluna] = String(linha[indice] ?? "");
      });
      return registro;
    });
}

export async function lerLinhas(nomeAba: string, colunas: string[]): Promise<Registro[]> {
  await garantirTabela(nomeAba, colunas);
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const ultimaColuna = letraColuna(colunas.length);

  const resposta = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${nomeAba}!A2:${ultimaColuna}`,
  });

  return linhasParaRegistros(resposta.data.values ?? [], colunas);
}

export async function adicionarLinha(nomeAba: string, colunas: string[], registro: Registro): Promise<void> {
  await garantirTabela(nomeAba, colunas);
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const valores = colunas.map((coluna) => registro[coluna] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${nomeAba}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [valores] },
  });
}

/** Atualiza (mesclando) a linha cuja coluna "id" bate com `id`. Retorna o registro completo já mesclado, ou `null` se não encontrar. */
export async function atualizarLinha(
  nomeAba: string,
  colunas: string[],
  id: string,
  // Registro (Record<string, string>) já aceita literais com só um subconjunto das colunas —
  // não precisa de Partial<Registro> (que tornaria os valores `string | undefined`).
  alteracoes: Registro
): Promise<Registro | null> {
  await garantirTabela(nomeAba, colunas);
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const ultimaColuna = letraColuna(colunas.length);

  const resposta = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${nomeAba}!A2:${ultimaColuna}`,
  });
  const linhas = resposta.data.values ?? [];
  const indiceColunaId = colunas.indexOf("id");
  const indice = linhas.findIndex((linha) => String(linha[indiceColunaId] ?? "") === id);
  if (indice === -1) return null;

  const registroAtual: Registro = {};
  colunas.forEach((coluna, i) => {
    registroAtual[coluna] = String(linhas[indice][i] ?? "");
  });
  const registroNovo: Registro = { ...registroAtual, ...alteracoes };

  const numeroLinha = indice + 2; // +1 (cabeçalho) +1 (1-based)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${nomeAba}!A${numeroLinha}:${ultimaColuna}${numeroLinha}`,
    valueInputOption: "RAW",
    requestBody: { values: [colunas.map((coluna) => registroNovo[coluna] ?? "")] },
  });

  return registroNovo;
}

export async function removerLinha(nomeAba: string, colunas: string[], id: string): Promise<boolean> {
  await garantirTabela(nomeAba, colunas);
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const ultimaColuna = letraColuna(colunas.length);

  const resposta = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${nomeAba}!A2:${ultimaColuna}`,
  });
  const linhas = resposta.data.values ?? [];
  const indiceColunaId = colunas.indexOf("id");
  const indice = linhas.findIndex((linha) => String(linha[indiceColunaId] ?? "") === id);
  if (indice === -1) return false;

  const aba = await obterAba(nomeAba);
  const sheetId = aba?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return false;

  const numeroLinha = indice + 2;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: numeroLinha - 1, endIndex: numeroLinha },
          },
        },
      ],
    },
  });

  return true;
}

/** Substitui todas as linhas de dados (mantendo o cabeçalho). Útil para tabelas chave/valor pequenas, como configurações. */
export async function definirLinhas(nomeAba: string, colunas: string[], registros: Registro[]): Promise<void> {
  await garantirTabela(nomeAba, colunas);
  const sheets = obterSheets();
  const spreadsheetId = obterSpreadsheetId();
  const ultimaColuna = letraColuna(colunas.length);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${nomeAba}!A2:${ultimaColuna}`,
  });

  if (registros.length === 0) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${nomeAba}!A2`,
    valueInputOption: "RAW",
    requestBody: { values: registros.map((registro) => colunas.map((coluna) => registro[coluna] ?? "")) },
  });
}
