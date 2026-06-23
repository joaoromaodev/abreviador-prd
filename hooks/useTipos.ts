"use client";

import { useCallback, useEffect, useState } from "react";
import type { TipoPRD } from "@/lib/types";

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function useTipos() {
  const [tipos, setTipos] = useState<TipoPRD[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/tipos");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar tipos."));
      setTipos(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar tipos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar();
  }, [recarregar]);

  async function adicionar(dados: { nome: string; template: string }) {
    const resposta = await fetch("/api/tipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao adicionar tipo."));
    const novo: TipoPRD = await resposta.json();
    setTipos((atual) => [...atual, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  async function editar(id: string, dados: { nome: string; template: string }) {
    const resposta = await fetch(`/api/tipos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao editar tipo."));
    const atualizado: TipoPRD = await resposta.json();
    setTipos((atual) =>
      atual.map((item) => (item.id === id ? atualizado : item)).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  async function remover(id: string) {
    const resposta = await fetch(`/api/tipos/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao remover tipo."));
    setTipos((atual) => atual.filter((item) => item.id !== id));
  }

  return { tipos, carregando, erro, recarregar, adicionar, editar, remover };
}
