// Importador de contratos das planilhas .ods para a aba "Contratos" do Google Sheets.
//
// Importa APENAS as categorias NOVAS (não toca em Locação/Terceirizada/Prestação já cadastradas),
// SÓ as abas VIGENTES, atribuindo a CATEGORIA certa a cada contrato (cria a categoria na aba Tipos
// com template vazio, se não existir). Preenche o bloco de empenho (credor, CNPJ, processo, nº do
// contrato, modalidade de licitação, objeto) e a vigência.
//
// Uso (na raiz do projeto, com .env.local presente):
//   node scripts/importar-contratos.mjs <pasta-com-ods> --explore   # lista abas, não grava
//   node scripts/importar-contratos.mjs <pasta-com-ods>             # dry-run: mostra o que gravaria
//   node scripts/importar-contratos.mjs <pasta-com-ods> --commit    # GRAVA na planilha
//
// Sem dependência nova: lê o .ods (zip) com zlib e a planilha com a googleapis já instalada.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { google } from "googleapis";

// Abas VIGENTES a importar -> categoria. fileMatch = trecho do nome do arquivo (sem acento/maiúsc.).
const ALLOWLIST = [
  { fileMatch: "AQUISI", tab: "AQUISIÇÕES DIVERSAS VIGENTES", categoria: "Consumo" },
  { fileMatch: "EMPREITADA", tab: "EMPREITADA GLOBAL VIGENTES", categoria: "Obra" },
  { fileMatch: "CESS", tab: "CONVÊNIO DE MUNICIPALIZAÇÃO VIGENTE 2026", categoria: "Convênio de Cessão Recíproca" },
  { fileMatch: "ENGENHARIA", tab: "CONVÊNIO DE ENGENHARIA VIGENTE 2026", categoria: "Convênio de Engenharia" },
  { fileMatch: "ENTIDADES", tab: "COVÊNIOS COM ENTIDADES PÚBLICAS VIGENTE 2024", categoria: "Parceria com Entidade Pública" },
  { fileMatch: "SOCIEDADES", tab: "CONVÊNIOS COM OSC - VIGENTES 2024", categoria: "Parceria com OSC" },
];

// Arquivos a NUNCA importar (categorias já cadastradas no app).
const IGNORAR_ARQUIVO = ["LOCA", "TERCEIR", "PREST"];

const ABA_CONTRATOS = "Contratos";
const COL_CONTRATOS = [
  "id", "tipoId", "nome", "temTermoAditivo", "quantidadeTermosAditivos",
  "vigenciaInicio", "vigenciaFim", "valores", "criadoEm", "atualizadoEm",
  "modalidades", "vigenciaIndeterminada", "dadosEmpenho",
];
const ABA_TIPOS = "Tipos";
const COL_TIPOS = ["id", "nome", "template", "criadoEm", "atualizadoEm"];

// --------------------------------------------------------------------------- .ods -> content.xml
function lerContentXml(caminho) {
  const buf = readFileSync(caminho);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("EOCD não encontrado em " + caminho);
  const total = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let e = 0; e < total; e++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("diretório central inválido");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const fnLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const nome = buf.toString("utf8", off + 46, off + 46 + fnLen);
    if (nome === "content.xml") {
      const lfn = buf.readUInt16LE(localOff + 26);
      const lex = buf.readUInt16LE(localOff + 28);
      const ini = localOff + 30 + lfn + lex;
      const comp = buf.subarray(ini, ini + compSize);
      return method === 0 ? comp.toString("utf8") : inflateRawSync(comp).toString("utf8");
    }
    off += 46 + fnLen + extraLen + commentLen;
  }
  throw new Error("content.xml não encontrado");
}

function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&");
}
function stripTags(s) { return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(); }

const MAX_COLS = 40;
function extrairTabelas(xml) {
  const tabelas = [];
  const reTab = /<table:table\b([^>]*)>([\s\S]*?)<\/table:table>/g;
  let m;
  while ((m = reTab.exec(xml))) {
    const nome = (m[1].match(/table:name="([^"]*)"/) || [])[1] || "";
    const linhas = [];
    const corpo = m[2].replace(/covered-table-cell/g, "table-cell");
    const reRow = /<table:table-row\b([^>]*)>([\s\S]*?)<\/table:table-row>/g;
    let r;
    while ((r = reRow.exec(corpo))) {
      let rowXml = r[2].replace(/<table:table-cell([^>]*)\/>/g, "<table:table-cell$1></table:table-cell>");
      const reCell = /<table:table-cell([^>]*)>([\s\S]*?)<\/table:table-cell>/g;
      const cells = [];
      let c;
      while ((c = reCell.exec(rowXml))) {
        const rep = Math.min(parseInt((c[1].match(/number-columns-repeated="(\d+)"/) || [])[1] || "1", 10), MAX_COLS);
        const paras = [...c[2].matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((p) => stripTags(p[1]));
        const txt = paras.join(" ").trim();
        for (let k = 0; k < rep && cells.length < MAX_COLS; k++) cells.push(txt);
      }
      while (cells.length && cells[cells.length - 1] === "") cells.pop();
      linhas.push(cells);
    }
    tabelas.push({ nome, linhas });
  }
  return tabelas;
}

// --------------------------------------------------------------------------- mapeamento de colunas
function norm(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}
const RE_PARTE = /(CONTRATADA|LOCADOR|MUNICIPIO|CONTRATANTE|ENTIDADE|\bOSC\b|CONVENENTE)/;

function acharCabecalho(linhas) {
  for (let i = 0; i < Math.min(linhas.length, 14); i++) {
    const n = linhas[i].map(norm);
    if (n.some((x) => RE_PARTE.test(x)) && n.some((x) => x.includes("OBJETO"))) return i;
  }
  return -1;
}

function mapearColunas(linhas, hi) {
  const H = (i) => (linhas[i] || []).map(norm);
  const sup = H(hi - 1), cab = H(hi), sub = H(hi + 1);
  const at = (row, i) => row[i] || "";
  const width = Math.max(sup.length, cab.length, sub.length);
  const idx = { processo: -1, numContrato: -1, contratada: -1, cnpj: -1, objeto: -1, modalidade: -1, vigInicio: -1, vigFim: -1 };
  let vigIdx = -1, valorIdx = -1;
  for (let i = 0; i < width; i++) {
    const c = at(cab, i), s = at(sup, i);
    if (idx.contratada < 0 && RE_PARTE.test(c)) idx.contratada = i;
    if (idx.cnpj < 0 && c.includes("CNPJ")) idx.cnpj = i;
    if (idx.processo < 0 && c.includes("PROCESSO")) idx.processo = i;
    if (idx.objeto < 0 && c.includes("OBJETO")) idx.objeto = i;
    if (idx.modalidade < 0 && c.includes("MODALIDADE")) idx.modalidade = i;
    if (idx.numContrato < 0 && /(CONTRATO|ACORDO|TERMO|CONVENIO)/.test(c) &&
        !c.includes("NATUREZA") && !c.includes("VIGENCIA") && !c.includes("MODALIDADE") &&
        !c.includes("VALOR") && !c.includes("DATA")) idx.numContrato = i;
    if (vigIdx < 0 && (c.includes("VIGENCIA") || s.includes("VIGENCIA"))) vigIdx = i;
    if (valorIdx < 0 && vigIdx >= 0 && i > vigIdx && (c.includes("VALOR") || s.includes("VALOR"))) valorIdx = i;
  }
  if (vigIdx >= 0) {
    const fim = valorIdx > vigIdx ? valorIdx : width;
    for (let i = vigIdx; i < fim; i++) {
      const t = at(cab, i) + " " + at(sub, i);
      if (t.includes("VALOR")) continue;
      if (idx.vigInicio < 0 && /INICI/.test(t)) idx.vigInicio = i;
      else if (idx.vigFim < 0 && /FINAL/.test(t)) idx.vigFim = i;
    }
    if (idx.vigInicio < 0) idx.vigInicio = vigIdx;
  }
  return idx;
}

function paraIso(br) {
  const m = norm(br).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}
function ehLinhaDados(cells, idx) {
  const contratada = (cells[idx.contratada] || "").trim();
  const num = idx.numContrato >= 0 ? (cells[idx.numContrato] || "").trim() : "";
  const obj = (cells[idx.objeto] || "").trim();
  return contratada !== "" && !RE_PARTE.test(norm(contratada)) && (num !== "" || obj !== "");
}
function linhaParaContrato(cells, idx, categoria) {
  const contratada = (cells[idx.contratada] || "").trim();
  const numContrato = idx.numContrato >= 0 ? (cells[idx.numContrato] || "").trim() : "";
  const de = {};
  const set = (k, v) => { if (v && v.trim()) de[k] = v.trim(); };
  set("credor", contratada);
  set("cnpj", cells[idx.cnpj]);
  set("processo", cells[idx.processo]);
  set("numContrato", numContrato);
  set("modalidadeLicitacao", cells[idx.modalidade]);
  set("objeto", cells[idx.objeto]);
  return {
    id: randomUUID(), tipoId: "",
    nome: numContrato ? `${numContrato} - ${contratada}` : contratada,
    temTermoAditivo: false, quantidadeTermosAditivos: 0,
    vigenciaInicio: paraIso(cells[idx.vigInicio]),
    vigenciaFim: idx.vigFim >= 0 ? paraIso(cells[idx.vigFim]) : "",
    vigenciaIndeterminada: false, valores: {}, modalidades: {}, dadosEmpenho: de, categoria,
  };
}
function contratoParaLinha(c, agora) {
  const reg = {
    id: c.id, tipoId: c.tipoId, nome: c.nome,
    temTermoAditivo: "false", quantidadeTermosAditivos: "0",
    vigenciaInicio: c.vigenciaInicio, vigenciaFim: c.vigenciaFim,
    valores: "{}", criadoEm: agora, atualizadoEm: agora,
    modalidades: "[]", vigenciaIndeterminada: "false", dadosEmpenho: JSON.stringify(c.dadosEmpenho),
  };
  return COL_CONTRATOS.map((k) => reg[k] ?? "");
}

// --------------------------------------------------------------------------- .env.local + Sheets
function carregarEnv() {
  if (!existsSync(".env.local")) return;
  for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
function sheetsClient() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const keyB = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!email || !keyB || !id) throw new Error("Faltam GOOGLE_SHEETS_* no .env.local");
  const key = keyB.includes("\\n") ? keyB.replace(/\\n/g, "\n") : keyB;
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return { sheets: google.sheets({ version: "v4", auth }), id };
}
async function lerColuna(sheets, id, aba, coluna) {
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${aba}!${coluna}2:${coluna}` });
  return (resp.data.values ?? []).map((r) => r[0] ?? "");
}
async function lerTipos(sheets, id) {
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${ABA_TIPOS}!A2:B` });
  return (resp.data.values ?? []).map((r) => ({ id: r[0] ?? "", nome: r[1] ?? "" })).filter((t) => t.id);
}

// --------------------------------------------------------------------------- main
async function main() {
  const args = process.argv.slice(2);
  const pasta = args.find((a) => !a.startsWith("--"));
  const explore = args.includes("--explore");
  const commit = args.includes("--commit");
  if (!pasta) { console.error("Uso: node scripts/importar-contratos.mjs <pasta> [--explore|--commit]"); process.exit(1); }

  const arquivos = readdirSync(pasta).filter((f) => f.toLowerCase().endsWith(".ods"));
  console.log(`Pasta: ${pasta}  (${arquivos.length} .ods)\n`);

  const coletados = [];
  for (const arq of arquivos) {
    const nn = norm(arq);
    if (IGNORAR_ARQUIVO.some((ig) => nn.includes(ig))) { console.log(`IGNORADO (já no app): ${arq}`); continue; }
    for (const tab of extrairTabelas(lerContentXml(join(pasta, arq)))) {
      const hi = acharCabecalho(tab.linhas);
      const cfg = ALLOWLIST.find((a) => nn.includes(norm(a.fileMatch)) && norm(a.tab) === norm(tab.nome));
      if (explore) {
        console.log(`  [${hi >= 0 ? (cfg ? "IMPORTA→" + cfg.categoria : "detectada") : "sem cabeçalho"}] ${arq} :: "${tab.nome}" (${tab.linhas.length} linhas)`);
        continue;
      }
      if (!cfg || hi < 0) continue;
      const idx = mapearColunas(tab.linhas, hi);
      for (let i = hi + 1; i < tab.linhas.length; i++) {
        if (ehLinhaDados(tab.linhas[i], idx)) coletados.push(linhaParaContrato(tab.linhas[i], idx, cfg.categoria));
      }
    }
  }
  if (explore) return;

  // Dedupe interno por nome.
  const vistos = new Set();
  const unicos = coletados.filter((c) => { const k = norm(c.nome); if (vistos.has(k)) return false; vistos.add(k); return true; });

  const { sheets, id } = sheetsClient();
  const nomesPlanilha = new Set((await lerColuna(sheets, id, ABA_CONTRATOS, "C")).map(norm));
  const novos = unicos.filter((c) => !nomesPlanilha.has(norm(c.nome)));
  const jaExistem = unicos.length - novos.length;

  const porCat = {};
  for (const c of novos) porCat[c.categoria] = (porCat[c.categoria] || 0) + 1;
  const tiposExistentes = await lerTipos(sheets, id);
  const nomeTipoParaId = new Map(tiposExistentes.map((t) => [norm(t.nome), t.id]));

  console.log("Categorias a importar (novos por categoria):");
  for (const [cat, n] of Object.entries(porCat)) {
    console.log(`  ${cat}: ${n}  ${nomeTipoParaId.has(norm(cat)) ? "(categoria já existe)" : "(será CRIADA)"}`);
  }
  console.log(`\nColetados: ${coletados.length} | únicos: ${unicos.length} | já na planilha: ${jaExistem} | NOVOS: ${novos.length}`);
  console.log("\nAmostra (até 3 por categoria):");
  for (const cat of Object.keys(porCat)) {
    console.log(`  — ${cat} —`);
    for (const c of novos.filter((x) => x.categoria === cat).slice(0, 3)) {
      console.log(`    • ${c.nome}  vig:${c.vigenciaInicio || "?"}→${c.vigenciaFim || "?"}  CNPJ:${c.dadosEmpenho.cnpj || "-"}  proc:${c.dadosEmpenho.processo || "-"}  mod:${c.dadosEmpenho.modalidadeLicitacao || "-"}`);
    }
  }

  if (!commit) { console.log("\n(DRY-RUN — nada gravado. Rode com --commit para gravar.)"); return; }

  // Garante que as categorias existem (cria com template vazio) e associa o tipoId.
  const agora = new Date().toISOString();
  for (const cat of Object.keys(porCat)) {
    if (!nomeTipoParaId.has(norm(cat))) {
      const novoId = randomUUID();
      await sheets.spreadsheets.values.append({
        spreadsheetId: id, range: `${ABA_TIPOS}!A1`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
        requestBody: { values: [COL_TIPOS.map((k) => ({ id: novoId, nome: cat, template: "", criadoEm: agora, atualizadoEm: agora })[k] ?? "")] },
      });
      nomeTipoParaId.set(norm(cat), novoId);
      console.log(`Categoria criada: ${cat}`);
    }
  }
  for (const c of novos) c.tipoId = nomeTipoParaId.get(norm(c.categoria)) || "";

  const linhas = novos.map((c) => contratoParaLinha(c, agora));
  for (let i = 0; i < linhas.length; i += 200) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id, range: `${ABA_CONTRATOS}!A1`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
      requestBody: { values: linhas.slice(i, i + 200) },
    });
    console.log(`Gravados ${Math.min(i + 200, linhas.length)}/${linhas.length}...`);
  }
  console.log(`\n✅ ${linhas.length} contratos gravados.`);
}

carregarEnv();
main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
