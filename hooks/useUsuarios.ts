"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";

async function extrairErro(resposta: Response, mensagemPadrao: string): Promise<string> {
  const corpo = await resposta.json().catch(() => null);
  return corpo?.erro ?? mensagemPadrao;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/usuarios");
      if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao carregar usuários."));
      setUsuarios(await resposta.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar usuários.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar();
  }, [recarregar]);

  async function adicionar(dados: { email: string; nome: string; papel: "admin" | "usuario" }) {
    const resposta = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao adicionar usuário."));
    const novo: Usuario = await resposta.json();
    setUsuarios((atual) => [...atual, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  async function editar(email: string, dados: { nome: string; papel: "admin" | "usuario" }) {
    const resposta = await fetch(`/api/usuarios/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao editar usuário."));
    const atualizado: Usuario = await resposta.json();
    setUsuarios((atual) =>
      atual.map((u) => (u.email === email ? atualizado : u)).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  async function remover(email: string) {
    const resposta = await fetch(`/api/usuarios/${encodeURIComponent(email)}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error(await extrairErro(resposta, "Falha ao remover usuário."));
    setUsuarios((atual) => atual.filter((u) => u.email !== email));
  }

  return { usuarios, carregando, erro, recarregar, adicionar, editar, remover };
}
