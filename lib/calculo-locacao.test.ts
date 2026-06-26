import { describe, expect, it } from "vitest";
import { calcularLocacao, derivarPeriodo, truncar2 } from "./calculo-locacao";

describe("truncar2", () => {
  it("trunca pra baixo em 2 casas", () => {
    expect(truncar2(513.3333)).toBe(513.33);
    expect(truncar2(116.669)).toBe(116.66);
    expect(truncar2(100)).toBe(100);
  });
});

describe("derivarPeriodo", () => {
  it("mês inicial incompleto: 28/jun a 31/ago = 2 meses cheios + 3 dias", () => {
    expect(derivarPeriodo("2026-06-28", "2026-08-31")).toEqual({ mesesCheios: 2, diasIncompletos: 3 });
  });

  it("mês final incompleto: 1/jan a 17/fev = 1 mês cheio + 17 dias", () => {
    expect(derivarPeriodo("2026-01-01", "2026-02-17")).toEqual({ mesesCheios: 1, diasIncompletos: 17 });
  });

  it("início em 27/fev conta 4 dias (27,28,29,30 — base 30)", () => {
    expect(derivarPeriodo("2026-02-27", "2026-04-30")).toEqual({ mesesCheios: 2, diasIncompletos: 4 });
  });

  it("fim em 28/fev (ano comum) é o último dia → mês cheio", () => {
    expect(derivarPeriodo("2026-01-01", "2026-02-28")).toEqual({ mesesCheios: 2, diasIncompletos: 0 });
  });

  it("fim em 27/fev é incompleto (27 dias)", () => {
    expect(derivarPeriodo("2026-01-01", "2026-02-27")).toEqual({ mesesCheios: 1, diasIncompletos: 27 });
  });

  it("ano bissexto: fim em 29/fev é o último dia → mês cheio", () => {
    expect(derivarPeriodo("2024-01-01", "2024-02-29")).toEqual({ mesesCheios: 2, diasIncompletos: 0 });
  });

  it("rejeita período inválido", () => {
    expect(derivarPeriodo("2026-08-31", "2026-06-28")).toBeNull();
    expect(derivarPeriodo("", "2026-01-01")).toBeNull();
  });
});

describe("calcularLocacao", () => {
  it("reproduz o exemplo da equipe (mensal R$ 15400, 2 meses + 3 dias)", () => {
    const r = calcularLocacao(15400, 3, 2);
    expect(r.valorDiaria).toBe(513.33);
    expect(r.valorDiarias).toBe(1539.99);
    expect(r.valorMesesCheios).toBe(30800);
    expect(r.valorTotal).toBe(32339.99);
  });

  it("o total é a soma de meses cheios + diárias", () => {
    const r = calcularLocacao(15400, 3, 2);
    expect(r.valorTotal).toBe(r.valorMesesCheios + r.valorDiarias);
  });

  it("sem dias incompletos, total = mensal * meses", () => {
    const r = calcularLocacao(15400, 0, 2);
    expect(r.valorDiarias).toBe(0);
    expect(r.valorTotal).toBe(30800);
  });
});
