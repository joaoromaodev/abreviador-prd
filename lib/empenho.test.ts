import { describe, expect, it } from "vitest";
import { normalizarDadosEmpenho, temDadosEmpenho } from "./empenho";

describe("normalizarDadosEmpenho", () => {
  it("mantém só as chaves do schema e apara os valores", () => {
    const saida = normalizarDadosEmpenho({
      credor: "  Empresa X  ",
      cnpj: "00.000.000/0001-00",
      naoExiste: "ignorado",
    });
    expect(saida).toEqual({ credor: "Empresa X", cnpj: "00.000.000/0001-00" });
  });

  it("descarta valores vazios ou só com espaços", () => {
    expect(normalizarDadosEmpenho({ credor: "   ", processo: "" })).toEqual({});
  });

  it("aceita entrada nula/indefinida", () => {
    expect(normalizarDadosEmpenho(null)).toEqual({});
    expect(normalizarDadosEmpenho(undefined)).toEqual({});
  });
});

describe("temDadosEmpenho", () => {
  it("false para vazio/indefinido", () => {
    expect(temDadosEmpenho(undefined)).toBe(false);
    expect(temDadosEmpenho({})).toBe(false);
    expect(temDadosEmpenho({ credor: "   " })).toBe(false);
  });

  it("true quando há algum valor preenchido", () => {
    expect(temDadosEmpenho({ credor: "Empresa X" })).toBe(true);
  });
});
