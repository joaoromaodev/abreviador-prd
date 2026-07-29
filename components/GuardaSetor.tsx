"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Setor } from "@/lib/setores";
import { useSessao } from "./SessaoProvider";

/**
 * Gate de UI para as páginas de um módulo: manda de volta para a Home quem não pode acessar o
 * setor (admin sempre passa). É só UX — a proteção real está nos guards das rotas /api
 * (exigirSetor). Espelha o padrão usado em app/cadastros/layout.tsx.
 */
export function GuardaSetor({ setor, children }: { setor: Setor; children: ReactNode }) {
  const router = useRouter();
  const { carregando, podeSetor } = useSessao();
  const liberado = podeSetor(setor);

  useEffect(() => {
    if (!carregando && !liberado) router.replace("/");
  }, [carregando, liberado, router]);

  if (carregando || !liberado) {
    return <p className="py-10 text-center text-sm text-gray-400">Carregando...</p>;
  }

  return <>{children}</>;
}
