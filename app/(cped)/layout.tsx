import type { ReactNode } from "react";
import { GuardaSetor } from "@/components/GuardaSetor";

// Módulo CPED (PRD): Modelos de PRD, Calculadora de Locação.
export default function LayoutCped({ children }: { children: ReactNode }) {
  return <GuardaSetor setor="CPED">{children}</GuardaSetor>;
}
