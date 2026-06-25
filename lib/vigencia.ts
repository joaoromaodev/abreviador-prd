// Análise da vigência de um contrato para avisar o usuário antes de gerar um PRD.
// Datas trabalhadas no formato ISO "YYYY-MM-DD" (o mesmo do <input type="date">).

/** Quantos dias antes do fim da vigência um contrato passa a ser marcado como "vencendo". */
export const DIAS_AVISO_VIGENCIA = 60;

export type StatusVigencia = "vigente" | "vencendo" | "expirado" | "sem_data";

export interface InfoVigencia {
  status: StatusVigencia;
  /** Dias até o fim da vigência (negativo se já expirou); null quando não há data. */
  diasRestantes: number | null;
}

const MS_POR_DIA = 86_400_000;

/** Classifica a vigência comparando o fim (ISO) com a data de hoje (ISO). */
export function analisarVigencia(
  vigenciaFim: string,
  hoje: string,
  diasAviso: number = DIAS_AVISO_VIGENCIA
): InfoVigencia {
  if (!vigenciaFim) return { status: "sem_data", diasRestantes: null };
  const fim = Date.parse(`${vigenciaFim}T00:00:00`);
  const ref = Date.parse(`${hoje}T00:00:00`);
  if (Number.isNaN(fim) || Number.isNaN(ref)) return { status: "sem_data", diasRestantes: null };

  const dias = Math.round((fim - ref) / MS_POR_DIA);
  if (dias < 0) return { status: "expirado", diasRestantes: dias };
  if (dias <= diasAviso) return { status: "vencendo", diasRestantes: dias };
  return { status: "vigente", diasRestantes: dias };
}

/** Data local de hoje em ISO "YYYY-MM-DD" (sem deslocamento de fuso). */
export function hojeISO(): string {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Converte uma data ISO "YYYY-MM-DD" para exibição "DD/MM/YYYY". Devolve a entrada se não casar. */
export function formatarData(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? "");
}
