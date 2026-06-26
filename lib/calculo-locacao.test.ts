import { describe, expect, it } from "vitest";
import { calcularLocacao, derivarPeriodo, truncar2 } from "./calculo-locacao";

describe("truncar2", () => {
  it("trunca pra baixo em 2 casas", () => {
    expect(truncar2(116.6667)).toBe(116.66);
    expect(truncar2(116.669)).toBe(116.66);
    expect(truncar2(100)).toBe(100);
  });
});

describe("derivarPeriodo", () => {
  it("1 jan a 17 fev = 1 mês cheio + 17 dias", () => {
    expect(derivarPeriodo("2026-01-01", "2026-02-17")).toEqual({ mesesCheios: 1, diasIncompletos: 17 });
  });

  it("fim no último dia do mês conta como mês cheio", () => {
    expect(derivarPeriodo("2026-01-01", "2026-02-28")).toEqual({ mesesCheios: 2, diasIncompletos: 0 });
    expect(derivarPeriodo("2026-01-01", "2026-01-31")).toEqual({ mesesCheios: 1, diasIncompletos: 0 });
  });

  it("considera ano bissexto no último dia de fevereiro", () => {
    expect(derivarPeriodo("2024-01-01", "2024-02-29")).toEqual({ mesesCheios: 2, diasIncompletos: 0 });
  });

  it("rejeita período inválido", () => {
    expect(derivarPeriodo("2026-02-17", "2026-01-01")).toBeNull();
    expect(derivarPeriodo("", "2026-01-01")).toBeNull();
  });
});

describe("calcularLocacao", () => {
  it("reproduz o exemplo da equipe (R$ 3500, 1 jan a 17 fev)", () => {
    const r = calcularLocacao(3500, 17, 1);
    expect(r.valorDiaria).toBe(116.66);
    expect(r.valorDiarias).toBe(1983.22);
    expect(r.valorMesesCheios).toBe(1516.78);
  });

  it("soma das partes bate com o total", () => {
    const r = calcularLocacao(3500, 17, 1);
    expect(r.valorDiarias + r.valorMesesCheios).toBeCloseTo(3500, 2);
  });

  it("sem dias incompletos, tudo vira meses cheios", () => {
    const r = calcularLocacao(3500, 0, 2);
    expect(r.valorDiarias).toBe(0);
    expect(r.valorMesesCheios).toBe(3500);
  });
});
