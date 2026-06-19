import { describe, expect, it } from "vitest";
import { aplicarAbreviacoes, verificarLimite } from "./abbreviation";
import type { PalavraAbreviacao } from "./types";

function entrada(palavra: string, abreviacao: string): PalavraAbreviacao {
  return { id: palavra, palavra, abreviacao };
}

const OPCOES_PADRAO = { caseSensitive: false, reaplicarAteEstabilizar: true };

describe("aplicarAbreviacoes", () => {
  it("substitui uma palavra cadastrada preservando o restante do texto", () => {
    const resultado = aplicarAbreviacoes("o documento de requisitos do produto", [entrada("documento", "doc")], OPCOES_PADRAO);
    expect(resultado).toBe("o doc de requisitos do produto");
  });

  it("não abrevia uma palavra que é apenas um pedaço de outra (respeita fronteira de token)", () => {
    const resultado = aplicarAbreviacoes("Compramos vários produtos novos", [entrada("Produto", "Prod")], OPCOES_PADRAO);
    expect(resultado).toBe("Compramos vários produtos novos");
  });

  it("preserva capitalização: primeira letra maiúscula", () => {
    const resultado = aplicarAbreviacoes("Produto novo no mercado", [entrada("produto", "prod")], OPCOES_PADRAO);
    expect(resultado).toBe("Prod novo no mercado");
  });

  it("preserva capitalização: tudo em maiúsculas", () => {
    const resultado = aplicarAbreviacoes("O PRODUTO está pronto", [entrada("produto", "prod")], OPCOES_PADRAO);
    expect(resultado).toBe("O PROD está pronto");
  });

  it("casa frases de múltiplas palavras", () => {
    const resultado = aplicarAbreviacoes(
      "O time de Recursos Humanos aprovou",
      [entrada("Recursos Humanos", "RH")],
      OPCOES_PADRAO
    );
    expect(resultado).toBe("O time de RH aprovou");
  });

  it("aplica entradas mais longas antes de entradas mais curtas que seriam substrings", () => {
    const dicionario = [entrada("Recursos", "Rec"), entrada("Recursos Humanos", "RH")];
    const resultado = aplicarAbreviacoes("Time de Recursos Humanos", dicionario, OPCOES_PADRAO);
    expect(resultado).toBe("Time de RH");
  });

  it("é case-insensitive por padrão", () => {
    const resultado = aplicarAbreviacoes("PRODUTO e produto e Produto", [entrada("produto", "prod")], OPCOES_PADRAO);
    expect(resultado).toBe("PROD e prod e Prod");
  });

  it("em modo case-sensitive só casa a grafia exata cadastrada", () => {
    const opcoes = { caseSensitive: true, reaplicarAteEstabilizar: true };
    const resultado = aplicarAbreviacoes("Produto e produto", [entrada("produto", "prod")], opcoes);
    expect(resultado).toBe("Produto e prod");
  });

  it("reaplica abreviações encadeadas quando reaplicarAteEstabilizar está ligado", () => {
    const dicionario = [
      entrada("Documento de Requisitos do Produto", "PRD"),
      entrada("PRD", "Doc"),
    ];
    const resultado = aplicarAbreviacoes("Escrevi o Documento de Requisitos do Produto hoje", dicionario, OPCOES_PADRAO);
    // 1ª passada: "Documento de Requisitos do Produto" -> "PRD" (capitaliza só a 1ª letra).
    // 2ª passada: o token "PRD" já está todo em maiúsculas -> a abreviação também fica em maiúsculas ("DOC").
    expect(resultado).toBe("Escrevi o DOC hoje");
  });

  it("não reaplica quando reaplicarAteEstabilizar está desligado", () => {
    const dicionario = [
      entrada("Documento de Requisitos do Produto", "PRD"),
      entrada("PRD", "Doc"),
    ];
    const opcoes = { caseSensitive: false, reaplicarAteEstabilizar: false };
    const resultado = aplicarAbreviacoes("Escrevi o Documento de Requisitos do Produto hoje", dicionario, opcoes);
    expect(resultado).toBe("Escrevi o PRD hoje");
  });

  it("retorna o texto original quando não há dicionário", () => {
    const resultado = aplicarAbreviacoes("texto qualquer", [], OPCOES_PADRAO);
    expect(resultado).toBe("texto qualquer");
  });

  it("ignora entradas com palavra ou abreviação vazia", () => {
    const dicionario = [entrada("  ", "x"), entrada("produto", "  ")];
    const resultado = aplicarAbreviacoes("o produto", dicionario, OPCOES_PADRAO);
    expect(resultado).toBe("o produto");
  });
});

describe("verificarLimite", () => {
  it("indica que o texto cabe quando está dentro do limite", () => {
    const resultado = verificarLimite("abc", 10);
    expect(resultado).toEqual({ cabe: true, tamanho: 3, limite: 10, excedente: 0 });
  });

  it("indica que o texto cabe exatamente no limite", () => {
    const resultado = verificarLimite("abcde", 5);
    expect(resultado.cabe).toBe(true);
    expect(resultado.excedente).toBe(0);
  });

  it("calcula corretamente o excedente quando o texto ultrapassa o limite", () => {
    const resultado = verificarLimite("abcdefghij", 4);
    expect(resultado.cabe).toBe(false);
    expect(resultado.tamanho).toBe(10);
    expect(resultado.excedente).toBe(6);
  });

  it("sinaliza que o texto ainda excede mesmo após abreviar tudo que era possível", () => {
    const textoOriginal = "Documento de Requisitos do Produto ".repeat(10).trim();
    const dicionario = [entrada("Documento de Requisitos do Produto", "PRD")];
    const limite = 20;

    const abreviado = aplicarAbreviacoes(textoOriginal, dicionario, OPCOES_PADRAO);
    const resultado = verificarLimite(abreviado, limite);

    expect(abreviado.length).toBeLessThan(textoOriginal.length);
    expect(resultado.cabe).toBe(false);
    expect(resultado.excedente).toBeGreaterThan(0);
    expect(resultado.excedente).toBe(abreviado.length - limite);
  });
});
