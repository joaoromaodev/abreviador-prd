import type { ReactNode } from "react";
import { GuardaSetor } from "@/components/GuardaSetor";

// Módulo CEO: Consulta para Empenho (SIAFE).
export default function LayoutCeo({ children }: { children: ReactNode }) {
  return <GuardaSetor setor="CEO">{children}</GuardaSetor>;
}
