import { describe, expect, it } from "vitest";
import { TIPO_LOCACAO_PADRAO } from "./constants";
import { extrairCampos, renderizar } from "./template";

const TEMPLATE = TIPO_LOCACAO_PADRAO.template;

const VALORES_MENSAIS = {
  pi: "1234",
  açao: "5678",
  programatica: "04.122.0001",
  projatv: "2001",
  produto: "PROD-X",
  fonte: "100",
  periodo: "01/06 a 30/06",
};

const VALORES_CONTRATO = {
  natdesp: "33903600",
  contrato: "123/2020",
  modalidade: "DISPENSA DE LICITACAO",
  textocontrato: "CONTRATO DE LOCACAO",
  textotermoadtivo: "8 TERMO ADITIVO",
  objdocontrato: "LOCACAO DE IMOVEL PARA A SEDE",
};

describe("extrairCampos", () => {
  it("separa campos mensais e de contrato, sem repetições e ignorando o token reservado termo", () => {
    const campos = extrairCampos(TEMPLATE);
    expect(campos.mensais).toEqual(["pi", "açao", "programatica", "projatv", "produto", "fonte", "periodo"]);
    expect(campos.contrato).toEqual([
      "natdesp",
      "contrato",
      "modalidade",
      "textocontrato",
      "textotermoadtivo",
      "objdocontrato",
    ]);
    expect(campos.usaTermo).toBe(true);
  });
});

describe("renderizar", () => {
  it("caso 1: contrato SEM termo aditivo remove o <<termo>> e o trecho do texto do T.A.", () => {
    const texto = renderizar(TEMPLATE, {
      valoresMensais: VALORES_MENSAIS,
      valoresContrato: VALORES_CONTRATO,
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).toContain("PAGAMENTO REFERENTE AO CONTRATO Nº 123/2020;");
    expect(texto).not.toContain("T.A");
    expect(texto).toContain("CONTRATO DE LOCACAO; OBJETO DO CONTRATO:");
    expect(texto).not.toContain("8 TERMO ADITIVO");
    expect(texto).not.toContain("/ ;");
  });

  it("caso 2: contrato COM termo aditivo monta (Nº T.A) e usa SÓ o texto do termo aditivo", () => {
    const texto = renderizar(TEMPLATE, {
      valoresMensais: VALORES_MENSAIS,
      valoresContrato: VALORES_CONTRATO,
      temTermoAditivo: true,
      quantidadeTermosAditivos: 8,
    });

    expect(texto).toContain("PAGAMENTO REFERENTE AO CONTRATO Nº 123/2020 (8º T.A);");
    expect(texto).toContain("8 TERMO ADITIVO; OBJETO DO CONTRATO:");
    expect(texto).not.toContain("CONTRATO DE LOCACAO");
    expect(texto).not.toContain(" / ");
  });

  it("substitui os campos mensais e o período (caso 3: data em texto livre)", () => {
    const texto = renderizar(TEMPLATE, {
      valoresMensais: { ...VALORES_MENSAIS, periodo: "01/junho" },
      valoresContrato: VALORES_CONTRATO,
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).toContain("PLANO INTERNO:1234,");
    expect(texto).toContain("PAGAMENTO REFERENTE AO PERIODO DE 01/junho;");
  });
});
