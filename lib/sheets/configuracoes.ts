import { CONFIG_PADRAO } from "@/lib/constants";
import type { Configuracoes } from "@/lib/types";
import { definirLinhas, lerLinhas, type Registro } from "./table";

const ABA = "Configuracoes";
const COLUNAS = ["chave", "valor"];

function paraConfiguracoes(linhas: Registro[]): Configuracoes {
  const mapa = new Map(linhas.map((linha) => [linha.chave, linha.valor]));
  const limiteBruto = Number(mapa.get("limiteCaracteres"));

  return {
    limiteCaracteres:
      Number.isFinite(limiteBruto) && limiteBruto > 0 ? Math.floor(limiteBruto) : CONFIG_PADRAO.limiteCaracteres,
    caseSensitive: mapa.has("caseSensitive") ? mapa.get("caseSensitive") === "true" : CONFIG_PADRAO.caseSensitive,
    reaplicarAteEstabilizar: mapa.has("reaplicarAteEstabilizar")
      ? mapa.get("reaplicarAteEstabilizar") === "true"
      : CONFIG_PADRAO.reaplicarAteEstabilizar,
  };
}

function paraLinhas(config: Configuracoes): Registro[] {
  return [
    { chave: "limiteCaracteres", valor: String(config.limiteCaracteres) },
    { chave: "caseSensitive", valor: String(config.caseSensitive) },
    { chave: "reaplicarAteEstabilizar", valor: String(config.reaplicarAteEstabilizar) },
  ];
}

export async function obterConfiguracoes(): Promise<Configuracoes> {
  const linhas = await lerLinhas(ABA, COLUNAS);
  if (linhas.length === 0) {
    await definirLinhas(ABA, COLUNAS, paraLinhas(CONFIG_PADRAO));
    return CONFIG_PADRAO;
  }
  return paraConfiguracoes(linhas);
}

export async function salvarConfiguracoes(config: Configuracoes): Promise<Configuracoes> {
  await definirLinhas(ABA, COLUNAS, paraLinhas(config));
  return config;
}
