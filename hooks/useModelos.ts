"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModeloPRD } from "@/lib/types";

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function useModelos() {
  const [modelos, setModelos] = useState<ModeloPRD[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/modelos");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar modelos."));
      setModelos(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar modelos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca os dados ao montar — o caso clássico de "Effects ARE for" da doc do React
  // (https://react.dev/learn/you-might-not-need-an-effect#fetching-data).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar();
  }, [recarregar]);

  async function adicionar(dados: { nome: string; conteudo: string }) {
    const resposta = await fetch("/api/modelos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao adicionar modelo."));
    const novo: ModeloPRD = await resposta.json();
    setModelos((atual) => [novo, ...atual]);
  }

  async function editar(id: string, dados: { nome: string; conteudo: string }) {
    const resposta = await fetch(`/api/modelos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao editar modelo."));
    const atualizado: ModeloPRD = await resposta.json();
    setModelos((atual) => atual.map((item) => (item.id === id ? atualizado : item)));
  }

  async function remover(id: string) {
    const resposta = await fetch(`/api/modelos/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao remover modelo."));
    setModelos((atual) => atual.filter((item) => item.id !== id));
  }

  return { modelos, carregando, erro, recarregar, adicionar, editar, remover };
}
