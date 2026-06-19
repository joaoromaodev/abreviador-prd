"use client";

import { useCallback, useEffect, useState } from "react";
import { CONFIG_PADRAO } from "@/lib/constants";
import type { Configuracoes } from "@/lib/types";

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes>(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/configuracoes");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar configurações."));
      setConfig(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar configurações.");
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

  async function salvar(novaConfig: Configuracoes) {
    const resposta = await fetch("/api/configuracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaConfig),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao salvar configurações."));
    const salva: Configuracoes = await resposta.json();
    setConfig(salva);
    return salva;
  }

  return { config, carregando, erro, recarregar, salvar };
}
