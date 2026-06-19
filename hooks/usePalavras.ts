"use client";

import { useCallback, useEffect, useState } from "react";
import type { PalavraAbreviacao } from "@/lib/types";

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function usePalavras() {
  const [palavras, setPalavras] = useState<PalavraAbreviacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/palavras");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar palavras."));
      setPalavras(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar palavras.");
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

  async function adicionar(dados: { palavra: string; abreviacao: string }) {
    const resposta = await fetch("/api/palavras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao adicionar palavra."));
    const nova: PalavraAbreviacao = await resposta.json();
    setPalavras((atual) => [...atual, nova].sort((a, b) => a.palavra.localeCompare(b.palavra, "pt-BR")));
  }

  async function editar(id: string, dados: { palavra: string; abreviacao: string }) {
    const resposta = await fetch(`/api/palavras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao editar palavra."));
    const atualizada: PalavraAbreviacao = await resposta.json();
    setPalavras((atual) => atual.map((item) => (item.id === id ? atualizada : item)));
  }

  async function remover(id: string) {
    const resposta = await fetch(`/api/palavras/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao remover palavra."));
    setPalavras((atual) => atual.filter((item) => item.id !== id));
  }

  return { palavras, carregando, erro, recarregar, adicionar, editar, remover };
}
