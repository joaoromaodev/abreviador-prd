import { analisarVigencia, formatarData, type StatusVigencia } from "@/lib/vigencia";

const ESTILO: Record<StatusVigencia, string> = {
  vigente: "bg-green-50 text-green-700 border-green-200",
  vencendo: "bg-amber-50 text-amber-800 border-amber-200",
  expirado: "bg-red-50 text-red-700 border-red-200",
  sem_data: "bg-gray-100 text-gray-500 border-gray-200",
};

function texto(vigenciaFim: string, hoje: string): string {
  const { status, diasRestantes } = analisarVigencia(vigenciaFim, hoje);
  switch (status) {
    case "expirado":
      return `Expirado há ${Math.abs(diasRestantes ?? 0)} dia(s)`;
    case "vencendo":
      return `Vence em ${diasRestantes} dia(s) — ${formatarData(vigenciaFim)}`;
    case "vigente":
      return `Vigente até ${formatarData(vigenciaFim)}`;
    default:
      return "Sem vigência informada";
  }
}

/** Etiqueta colorida com a situação da vigência de um contrato. */
export function EtiquetaVigencia({
  vigenciaFim,
  hoje,
  indeterminada = false,
}: {
  vigenciaFim: string;
  hoje: string;
  indeterminada?: boolean;
}) {
  if (indeterminada) {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        Prazo indeterminado
      </span>
    );
  }
  const { status } = analisarVigencia(vigenciaFim, hoje);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILO[status]}`}
    >
      {texto(vigenciaFim, hoje)}
    </span>
  );
}
