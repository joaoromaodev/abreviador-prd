import { describe, expect, it } from "vitest";
import {
  ehAdminDoSetor,
  hrefInicial,
  podeAlgumCadastro,
  podeEditarBlocoEmpenho,
  podeEditarBlocoPRD,
  podeEditarContratos,
  podeGerenciarConfiguracoes,
  podeGerenciarUsuarios,
  podeAcessarSetor,
  setoresEfetivos,
} from "./setores";

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
  it("master acessa qualquer setor, mesmo sem setores marcados", () => {
    expect(podeAcessarSetor({ papel: "master", setores: [] }, "CEO")).toBe(true);
    expect(podeAcessarSetor({ papel: "master", setores: [] }, "CPED")).toBe(true);
  });

  it("admin agora é gated pelos setores (não acessa tudo)", () => {
    expect(podeAcessarSetor({ papel: "admin", setores: ["CEO"] }, "CEO")).toBe(true);
    expect(podeAcessarSetor({ papel: "admin", setores: ["CEO"] }, "CPED")).toBe(false);
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

describe("capacidades (papel × setor)", () => {
  const master = { papel: "master", setores: [] } as const;
  const adminCEO = { papel: "admin", setores: ["CEO"] } as const;
  const adminCPED = { papel: "admin", setores: ["CPED"] } as const;
  const usuario = { papel: "usuario", setores: ["CEO"] } as const;

  it("só o master gerencia usuários e configurações", () => {
    expect(podeGerenciarUsuarios(master)).toBe(true);
    expect(podeGerenciarConfiguracoes(master)).toBe(true);
    for (const p of [adminCEO, adminCPED, usuario]) {
      expect(podeGerenciarUsuarios(p)).toBe(false);
      expect(podeGerenciarConfiguracoes(p)).toBe(false);
    }
  });

  it("master e qualquer admin editam contratos (base); usuário não", () => {
    expect(podeEditarContratos(master)).toBe(true);
    expect(podeEditarContratos(adminCEO)).toBe(true);
    expect(podeEditarContratos(adminCPED)).toBe(true);
    expect(podeEditarContratos(usuario)).toBe(false);
  });

  it("bloco PRD é do CPED (e master); bloco Empenho é do CEO (e master)", () => {
    expect(podeEditarBlocoPRD(adminCPED)).toBe(true);
    expect(podeEditarBlocoPRD(adminCEO)).toBe(false);
    expect(podeEditarBlocoPRD(master)).toBe(true);

    expect(podeEditarBlocoEmpenho(adminCEO)).toBe(true);
    expect(podeEditarBlocoEmpenho(adminCPED)).toBe(false);
    expect(podeEditarBlocoEmpenho(master)).toBe(true);
  });

  it("ehAdminDoSetor: master sempre; admin só no seu setor; usuário nunca", () => {
    expect(ehAdminDoSetor(master, "CPED")).toBe(true);
    expect(ehAdminDoSetor(adminCPED, "CPED")).toBe(true);
    expect(ehAdminDoSetor(adminCEO, "CPED")).toBe(false);
    expect(ehAdminDoSetor(usuario, "CEO")).toBe(false);
  });

  it("podeAlgumCadastro: master e admin sim; usuário não", () => {
    expect(podeAlgumCadastro(master)).toBe(true);
    expect(podeAlgumCadastro(adminCEO)).toBe(true);
    expect(podeAlgumCadastro(usuario)).toBe(false);
  });
});

describe("hrefInicial", () => {
  it("manda quem tem CPED para o Abreviador", () => {
    expect(hrefInicial({ papel: "usuario", setores: ["CPED"] })).toBe("/");
    expect(hrefInicial({ papel: "usuario", setores: ["CPED", "CEO"] })).toBe("/");
  });

  it("manda usuário só do CEO direto para a Consulta para Empenho", () => {
    expect(hrefInicial({ papel: "usuario", setores: ["CEO"] })).toBe("/empenho");
  });

  it("admin cai no Abreviador", () => {
    expect(hrefInicial({ papel: "admin", setores: [] })).toBe("/");
  });

  it("usuário sem setores (retrocompatível) cai no Abreviador", () => {
    expect(hrefInicial({ papel: "usuario", setores: [] })).toBe("/");
  });
});
