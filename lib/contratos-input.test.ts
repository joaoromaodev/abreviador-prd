import { describe, expect, it } from "vitest";
import { aplicarPermissoesContrato } from "./contratos-input";
import type { DadosContrato } from "./sheets/contratos";

const BASE: DadosContrato = {
  tipoId: "",
  nome: "",
  temTermoAditivo: false,
  quantidadeTermosAditivos: 0,
  vigenciaInicio: "",
  vigenciaFim: "",
  vigenciaIndeterminada: false,
  valores: {},
  modalidades: [],
  dadosEmpenho: {},
};

/** Contrato "existente" com os dois blocos preenchidos. */
const atual: DadosContrato = {
  ...BASE,
  tipoId: "tipo-locacao",
  nome: "Sede - 1/2020",
  valores: { valorAluguel: "1000" },
  modalidades: [{ nome: "Única", valores: {} }],
  dadosEmpenho: { credor: "ACME", fonte: "0101" },
};

/** O que o formulário mandou (com os dois blocos alterados). */
const entrada: DadosContrato = {
  ...BASE,
  tipoId: "tipo-obra",
  nome: "Sede - 1/2020 (editado)",
  valores: { valorAluguel: "9999" },
  modalidades: [{ nome: "Nova", valores: {} }],
  dadosEmpenho: { credor: "OUTRO", fonte: "0202" },
};

describe("aplicarPermissoesContrato", () => {
  it("admin da CEO edita a base e o empenho, mas NÃO o bloco PRD", () => {
    const r = aplicarPermissoesContrato(entrada, atual, { prd: false, empenho: true });
    // base + empenho: da entrada
    expect(r.nome).toBe("Sede - 1/2020 (editado)");
    expect(r.dadosEmpenho).toEqual({ credor: "OUTRO", fonte: "0202" });
    // bloco PRD: preservado do atual
    expect(r.tipoId).toBe("tipo-locacao");
    expect(r.valores).toEqual({ valorAluguel: "1000" });
    expect(r.modalidades).toEqual([{ nome: "Única", valores: {} }]);
  });

  it("admin da CPED edita a base e o PRD, mas NÃO o empenho", () => {
    const r = aplicarPermissoesContrato(entrada, atual, { prd: true, empenho: false });
    expect(r.tipoId).toBe("tipo-obra");
    expect(r.valores).toEqual({ valorAluguel: "9999" });
    expect(r.modalidades).toEqual([{ nome: "Nova", valores: {} }]);
    // empenho: preservado do atual
    expect(r.dadosEmpenho).toEqual({ credor: "ACME", fonte: "0101" });
  });

  it("master edita os dois blocos", () => {
    const r = aplicarPermissoesContrato(entrada, atual, { prd: true, empenho: true });
    expect(r.tipoId).toBe("tipo-obra");
    expect(r.dadosEmpenho).toEqual({ credor: "OUTRO", fonte: "0202" });
  });

  it("na criação (sem atual), o bloco que o editor não pode escrever fica vazio", () => {
    const r = aplicarPermissoesContrato(entrada, null, { prd: false, empenho: true });
    expect(r.tipoId).toBe("");
    expect(r.valores).toEqual({});
    expect(r.modalidades).toEqual([]);
    expect(r.dadosEmpenho).toEqual({ credor: "OUTRO", fonte: "0202" });
    // base sempre vem da entrada
    expect(r.nome).toBe("Sede - 1/2020 (editado)");
  });
});
