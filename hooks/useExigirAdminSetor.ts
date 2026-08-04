"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ehAdminDoSetor, type Setor } from "@/lib/setores";
import { useSessao } from "@/components/SessaoProvider";

/**
 * Gate de UI para cadastros de um setor (ex.: Categorias e Palavras são do CPED): manda quem não é
 * admin do setor (nem master) de volta para os Contratos, que qualquer admin acessa. É só UX — a
 * proteção real está no guard da rota /api (exigirAdminDoSetor). Retorna `true` só quando liberado.
 */
export function useExigirAdminSetor(setor: Setor): boolean {
  const router = useRouter();
  const { usuario, carregando } = useSessao();
  const liberado = usuario ? ehAdminDoSetor(usuario, setor) : false;

  useEffect(() => {
    if (!carregando && !liberado) router.replace("/cadastros/contratos");
  }, [carregando, liberado, router]);

  return liberado && !carregando;
}
