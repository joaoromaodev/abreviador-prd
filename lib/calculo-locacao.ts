// Calculadora de Locação: a partir do VALOR MENSAL e do período, calcula o valor dos meses
// cheios, o valor das diárias do(s) mês(es) incompleto(s) e o total a pagar.
//
// Regra (definida pela equipe):
//   - diária = valor mensal / 30 (SEMPRE 30, independente do mês), truncado pra baixo em 2 casas.
//   - valor das diárias  = diária * (dias do mês incompleto).
//   - valor dos meses cheios = valor mensal * (qtd de meses cheios).
//   - total a pagar = valor dos meses cheios + valor das diárias.

export interface ResultadoLocacao {
  mesesCheios: number;
  diasIncompletos: number;
  valorDiaria: number;
  valorDiarias: number;
  valorMesesCheios: number;
  valorTotal: number;
}

/** Trunca pra baixo em 2 casas (com um epsilon contra imprecisão de ponto flutuante). */
export function truncar2(valor: number): number {
  return Math.floor((valor + 1e-9) * 100) / 100;
}

function arredondar2(valor: number): number {
  return Math.round((valor + 1e-9) * 100) / 100;
}

interface DataSimples {
  ano: number;
  mes: number;
  dia: number;
}

function parseISO(iso: string): DataSimples | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return null;
  return { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

/** Quantos dias o mês realmente tem (mes 1-based; respeita ano bissexto). */
function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Deriva "meses cheios" e "dias incompletos" de um período (datas ISO).
 *   - Mês inicial que não começa no dia 1º é incompleto: conta do dia de início até o dia 30
 *     (base 30 sempre — ex.: 27/fev gera 4 dias: 27, 28, 29, 30).
 *   - Mês final que não termina no último dia real do mês é incompleto: conta do dia 1 até o
 *     dia de fim (ex.: 28/fev em ano comum é o último dia → mês cheio; 27/fev → 27 dias).
 * Retorna null se as datas forem inválidas.
 */
export function derivarPeriodo(
  inicioISO: string,
  fimISO: string
): { mesesCheios: number; diasIncompletos: number } | null {
  const ini = parseISO(inicioISO);
  const fim = parseISO(fimISO);
  if (!ini || !fim || fimISO < inicioISO) return null;

  // Período curto dentro de um único mês: conta os dias ocupados direto.
  if (ini.ano === fim.ano && ini.mes === fim.mes) {
    return { mesesCheios: 0, diasIncompletos: fim.dia - ini.dia + 1 };
  }

  let diasIncompletos = 0;
  let primeiroAno = ini.ano;
  let primeiroMes = ini.mes;
  let ultimoAno = fim.ano;
  let ultimoMes = fim.mes;

  // Mês inicial incompleto (não começa no dia 1º).
  if (ini.dia > 1) {
    diasIncompletos += 30 - ini.dia + 1;
    if (primeiroMes === 12) {
      primeiroMes = 1;
      primeiroAno += 1;
    } else {
      primeiroMes += 1;
    }
  }

  // Mês final incompleto (não termina no último dia real do mês).
  if (fim.dia < diasNoMes(fim.ano, fim.mes)) {
    diasIncompletos += fim.dia;
    if (ultimoMes === 1) {
      ultimoMes = 12;
      ultimoAno -= 1;
    } else {
      ultimoMes -= 1;
    }
  }

  let mesesCheios = (ultimoAno - primeiroAno) * 12 + (ultimoMes - primeiroMes) + 1;
  if (mesesCheios < 0) mesesCheios = 0;

  return { mesesCheios, diasIncompletos };
}

/** Faz a conta da locação a partir do valor mensal. */
export function calcularLocacao(
  valorMensal: number,
  diasIncompletos: number,
  mesesCheios: number
): ResultadoLocacao {
  const valorDiaria = truncar2(valorMensal / 30);
  const valorDiarias = arredondar2(valorDiaria * diasIncompletos);
  const valorMesesCheios = arredondar2(valorMensal * mesesCheios);
  const valorTotal = arredondar2(valorMesesCheios + valorDiarias);
  return { mesesCheios, diasIncompletos, valorDiaria, valorDiarias, valorMesesCheios, valorTotal };
}
