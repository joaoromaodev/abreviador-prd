"use client";

import { useCallback, useEffect, useState } from "react";
import type { Contrato } from "@/lib/types";

export interface DadosFormContrato {
  tipoId: string;
  nome: string;
  temTermoAditivo: boolean;
  quantidadeTermosAditivos: number;
  valores: Record<string, string>;
}

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/contratos");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar contratos."));
      setContratos(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar contratos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar();
  }, [recarregar]);

  async function adicionar(dados: DadosFormContrato) {
    const resposta = await fetch("/api/contratos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao adicionar contrato."));
    const novo: Contrato = await resposta.json();
    setContratos((atual) => [...atual, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  async function editar(id: string, dados: DadosFormContrato) {
    const resposta = await fetch(`/api/contratos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao editar contrato."));
    const atualizado: Contrato = await resposta.json();
    setContratos((atual) =>
      atual.map((item) => (item.id === id ? atualizado : item)).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  async function remover(id: string) {
    const resposta = await fetch(`/api/contratos/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao remover contrato."));
    setContratos((atual) => atual.filter((item) => item.id !== id));
  }

  return { contratos, carregando, erro, recarregar, adicionar, editar, remover };
}
