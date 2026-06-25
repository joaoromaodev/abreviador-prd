import { describe, expect, it } from "vitest";
import { analisarVigencia, formatarData } from "./vigencia";

const HOJE = "2026-06-25";

describe("analisarVigencia", () => {
  it("marca como expirado quando o fim já passou", () => {
    const info = analisarVigencia("2026-06-11", HOJE);
    expect(info.status).toBe("expirado");
    expect(info.diasRestantes).toBe(-14);
  });

  it("marca como vencendo dentro da janela de aviso (60 dias)", () => {
    const info = analisarVigencia("2026-08-01", HOJE);
    expect(info.status).toBe("vencendo");
    expect(info.diasRestantes).toBe(37);
  });

  it("marca como vigente quando falta mais que a janela de aviso", () => {
    expect(analisarVigencia("2027-05-03", HOJE).status).toBe("vigente");
  });

  it("usa o limite da janela como vencendo (exatamente 60 dias)", () => {
    expect(analisarVigencia("2026-08-24", HOJE).status).toBe("vencendo");
  });

  it("respeita uma janela de aviso customizada", () => {
    expect(analisarVigencia("2026-08-01", HOJE, 30).status).toBe("vigente");
  });

  it("retorna sem_data quando não há vigência ou a data é inválida", () => {
    expect(analisarVigencia("", HOJE).status).toBe("sem_data");
    expect(analisarVigencia("31/12/2026", HOJE).status).toBe("sem_data");
  });
});

describe("formatarData", () => {
  it("converte ISO para DD/MM/YYYY", () => {
    expect(formatarData("2026-06-25")).toBe("25/06/2026");
  });
  it("devolve a entrada quando não casa o formato", () => {
    expect(formatarData("")).toBe("");
  });
});
