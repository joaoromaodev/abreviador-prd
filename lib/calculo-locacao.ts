// Calculadora de Locação: separa um valor total entre os "meses cheios" e as "diárias" do
// mês incompleto de um período.
//
// Regra (definida pela equipe):
//   - diária  = total / 30 (SEMPRE 30, independente do mês), truncado pra baixo em 2 casas.
//   - valor das diárias = diária * (dias do mês incompleto).
//   - valor dos meses cheios = total - valor das diárias.

export interface ResultadoLocacao {
  mesesCheios: number;
  diasIncompletos: number;
  valorDiaria: number;
  valorDiarias: number;
  valorMesesCheios: number;
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

/** Quantos dias tem o mês (mes 1-based). */
function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Deriva "meses cheios" e "dias do mês incompleto" de um período (datas ISO), assumindo início
 * no dia 1º. Se o fim cair no último dia do mês, esse mês conta como cheio. Retorna null se inválido.
 */
export function derivarPeriodo(
  inicioISO: string,
  fimISO: string
): { mesesCheios: number; diasIncompletos: number } | null {
  const ini = parseISO(inicioISO);
  const fim = parseISO(fimISO);
  if (!ini || !fim || fimISO < inicioISO) return null;

  const mesesEntre = (fim.ano - ini.ano) * 12 + (fim.mes - ini.mes);
  const fimEhFimDeMes = fim.dia === diasNoMes(fim.ano, fim.mes);

  if (fimEhFimDeMes) {
    return { mesesCheios: mesesEntre + 1, diasIncompletos: 0 };
  }
  return { mesesCheios: mesesEntre, diasIncompletos: fim.dia };
}

/** Faz a conta da locação. Só `total` e `diasIncompletos` afetam os valores; `mesesCheios` é informativo. */
export function calcularLocacao(total: number, diasIncompletos: number, mesesCheios: number): ResultadoLocacao {
  const valorDiaria = truncar2(total / 30);
  const valorDiarias = arredondar2(valorDiaria * diasIncompletos);
  const valorMesesCheios = arredondar2(total - valorDiarias);
  return { mesesCheios, diasIncompletos, valorDiaria, valorDiarias, valorMesesCheios };
}
