import { describe, expect, it } from "vitest";
import { MODALIDADE_NAO_IMPRESSA, TIPO_LOCACAO_PADRAO } from "./constants";
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
  textotermoadtivo: "8 TERMO ADITIVO",
  objdocontrato: "LOCACAO DE IMOVEL PARA A SEDE",
};

// Template no estilo Terceirizada: campos por modalidade `[[...]]` + reservado `[[modalidade]]`.
const TEMPLATE_MODALIDADE =
  "PLANO INTERNO: [[pi]]; ACAO: [[acao]]; FONTE: <<fonte>>; CONTRATO Nº {contrato} <<termo>>; " +
  "modalidade: [[modalidade]]; objeto: {textocontrato} / {textotermoadtivo}";

describe("extrairCampos", () => {
  it("separa campos mensais e de contrato, sem repetições e ignorando o token reservado termo", () => {
    const campos = extrairCampos(TEMPLATE);
    expect(campos.mensais).toEqual(["pi", "açao", "programatica", "projatv", "produto", "fonte", "periodo"]);
    expect(campos.contrato).toEqual(["natdesp", "contrato", "modalidade", "textotermoadtivo", "objdocontrato"]);
    expect(campos.usaTermo).toBe(true);
  });

  it("template sem [[...]] não usa modalidades", () => {
    const campos = extrairCampos(TEMPLATE);
    expect(campos.modalidades).toEqual([]);
    expect(campos.usaModalidade).toBe(false);
  });

  it("detecta campos por modalidade e ignora o token reservado modalidade na lista", () => {
    const campos = extrairCampos(TEMPLATE_MODALIDADE);
    expect(campos.modalidades).toEqual(["pi", "acao"]);
    expect(campos.usaModalidade).toBe(true);
    expect(campos.mensais).toEqual(["fonte"]);
    expect(campos.contrato).toEqual(["contrato", "textocontrato", "textotermoadtivo"]);
  });
});

describe("renderizar", () => {
  it("caso 1: contrato SEM termo aditivo remove o <<termo>> e o segmento do texto do T.A. (sem ';' órfão)", () => {
    const texto = renderizar(TEMPLATE, {
      valoresMensais: VALORES_MENSAIS,
      valoresContrato: VALORES_CONTRATO,
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).toContain("PAGAMENTO REFERENTE AO CONTRATO Nº 123/2020;");
    expect(texto).not.toContain("T.A");
    expect(texto).not.toContain("8 TERMO ADITIVO");
    expect(texto).toContain("PAGAMENTO REFERENTE AO PERIODO DE 01/06 a 30/06; OBJETO DO CONTRATO:");
    expect(texto).not.toContain(";;");
  });

  it("caso 2: contrato COM termo aditivo monta (Nº T.A) e usa o texto do termo aditivo", () => {
    const texto = renderizar(TEMPLATE, {
      valoresMensais: VALORES_MENSAIS,
      valoresContrato: VALORES_CONTRATO,
      temTermoAditivo: true,
      quantidadeTermosAditivos: 8,
    });

    expect(texto).toContain("PAGAMENTO REFERENTE AO CONTRATO Nº 123/2020 (8º T.A);");
    expect(texto).toContain("8 TERMO ADITIVO; OBJETO DO CONTRATO:");
    expect(texto).not.toContain(";;");
  });

  it("modalidade: usa os valores da modalidade escolhida e imprime o nome dela em [[modalidade]]", () => {
    const texto = renderizar(TEMPLATE_MODALIDADE, {
      valoresMensais: { fonte: "0150-TESOURO" },
      valoresContrato: { contrato: "014/2025", textocontrato: "PRESTACAO DE SERVICOS DE MERENDA" },
      valoresModalidade: { pi: "1010008904C", acao: "283.554" },
      nomeModalidade: "Ensino Fundamental",
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).toContain("PLANO INTERNO: 1010008904C;");
    expect(texto).toContain("ACAO: 283.554;");
    expect(texto).toContain("modalidade: Ensino Fundamental;");
    expect(texto).toContain("FONTE: 0150-TESOURO;");
    expect(texto).toContain("objeto: PRESTACAO DE SERVICOS DE MERENDA");
  });

  it("modalidade: trocar a modalidade troca todos os valores [[...]] no mesmo contrato", () => {
    const base = {
      valoresMensais: { fonte: "0150-TESOURO" },
      valoresContrato: { contrato: "014/2025", textocontrato: "MERENDA" },
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    };
    const fundamental = renderizar(TEMPLATE_MODALIDADE, {
      ...base,
      valoresModalidade: { pi: "1010008904C", acao: "283.554" },
      nomeModalidade: "Ensino Fundamental",
    });
    const medio = renderizar(TEMPLATE_MODALIDADE, {
      ...base,
      valoresModalidade: { pi: "1010008906C", acao: "283.557" },
      nomeModalidade: "Ensino Médio",
    });

    expect(fundamental).toContain("PLANO INTERNO: 1010008904C;");
    expect(medio).toContain("PLANO INTERNO: 1010008906C;");
    expect(medio).toContain("modalidade: Ensino Médio;");
    expect(fundamental).not.toContain("1010008906C");
  });

  it("modalidade não impressa: some o rótulo junto com o nome, sem deixar 'modalidade:' órfão", () => {
    const texto = renderizar(TEMPLATE_MODALIDADE, {
      valoresMensais: { fonte: "0150-TESOURO" },
      valoresContrato: { contrato: "014/2025", textocontrato: "PRESTACAO DE SERVICOS" },
      valoresModalidade: { pi: "1010008904C", acao: "283.554" },
      nomeModalidade: MODALIDADE_NAO_IMPRESSA,
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).not.toMatch(/modalidade/i);
    expect(texto).not.toContain(";;");
    // Os demais campos da modalidade continuam saindo normalmente.
    expect(texto).toContain("PLANO INTERNO: 1010008904C;");
    expect(texto).toContain("ACAO: 283.554;");
    expect(texto).toContain("FONTE: 0150-TESOURO;");
    expect(texto).toContain("CONTRATO Nº 014/2025;");
    expect(texto).toContain("objeto: PRESTACAO DE SERVICOS");
  });

  it("modalidade não impressa: template sem rótulo antes do token só perde o nome", () => {
    const texto = renderizar("PI: [[pi]]; [[modalidade]]; FONTE: <<fonte>>", {
      valoresMensais: { fonte: "0150" },
      valoresContrato: {},
      valoresModalidade: { pi: "1010008904C" },
      nomeModalidade: MODALIDADE_NAO_IMPRESSA,
      temTermoAditivo: false,
      quantidadeTermosAditivos: 0,
    });

    expect(texto).toBe("PI: 1010008904C; FONTE: 0150");
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
