import { describe, expect, it } from "vitest";
import { podeAcessarSetor, setoresEfetivos } from "./setores";

describe("setoresEfetivos", () => {
  it("trata lista vazia como CPED (retrocompatibilidade)", () => {
    expect(setoresEfetivos([])).toEqual(["CPED"]);
    expect(setoresEfetivos(undefined)).toEqual(["CPED"]);
  });

  it("descarta valores inválidos", () => {
    expect(setoresEfetivos(["CEO", "XPTO"])).toEqual(["CEO"]);
  });

  it("cai em CPED quando só há valores inválidos", () => {
    expect(setoresEfetivos(["XPTO"])).toEqual(["CPED"]);
  });

  it("mantém os setores válidos informados", () => {
    expect(setoresEfetivos(["CPED", "CEO"]).sort()).toEqual(["CEO", "CPED"]);
  });
});

describe("podeAcessarSetor", () => {
  it("admin acessa qualquer setor, mesmo sem setores marcados", () => {
    expect(podeAcessarSetor({ papel: "admin", setores: [] }, "CEO")).toBe(true);
    expect(podeAcessarSetor({ papel: "admin", setores: [] }, "CPED")).toBe(true);
  });

  it("usuário acessa só os setores marcados", () => {
    expect(podeAcessarSetor({ papel: "usuario", setores: ["CEO"] }, "CEO")).toBe(true);
    expect(podeAcessarSetor({ papel: "usuario", setores: ["CEO"] }, "CPED")).toBe(false);
  });

  it("usuário sem setores recai em CPED", () => {
    expect(podeAcessarSetor({ papel: "usuario", setores: [] }, "CPED")).toBe(true);
    expect(podeAcessarSetor({ papel: "usuario", setores: [] }, "CEO")).toBe(false);
  });
});
