"use client";

import { useState, type FormEvent } from "react";
import type { Usuario } from "@/lib/types";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useSessao } from "@/components/SessaoProvider";
import { Botao, CampoTexto, Card, Rotulo, Selecao } from "@/components/ui";

export default function PaginaUsuarios() {
  const { usuario: eu } = useSessao();
  const { usuarios, carregando, erro: erroCarregamento, adicionar, editar, remover } = useUsuarios();

  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<"admin" | "usuario">("usuario");
  const [editandoEmail, setEditandoEmail] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function limparFormulario() {
    setEmail("");
    setNome("");
    setPapel("usuario");
    setEditandoEmail(null);
    setErro(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editandoEmail && !email.trim()) {
      setErro("Informe o e-mail (o mesmo da conta Google).");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe o nome do usuário.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      if (editandoEmail) {
        await editar(editandoEmail, { nome: nome.trim(), papel });
      } else {
        await adicionar({ email: email.trim().toLowerCase(), nome: nome.trim(), papel });
      }
      limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(u: Usuario) {
    setEditandoEmail(u.email);
    setEmail(u.email);
    setNome(u.nome);
    setPapel(u.papel);
    setErro(null);
  }

  async function handleRemover(u: Usuario) {
    if (!window.confirm(`Remover o acesso de "${u.nome}" (${u.email})?`)) return;
    try {
      await remover(u.email);
      if (editandoEmail === u.email) limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Usuários</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quem pode entrar no sistema e com qual papel. <strong>Admin</strong> edita contratos, tipos, palavras e
          configurações; <strong>usuário</strong> só gera PRDs e usa o Abreviador. O e-mail deve ser o da conta Google
          da pessoa.
        </p>
      </div>

      {erroCarregamento && (
        <p role="alert" className="text-sm text-red-600">
          {erroCarregamento}
        </p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Rotulo htmlFor="campo-email">E-mail (conta Google)</Rotulo>
              <CampoTexto
                id="campo-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@exemplo.com"
                disabled={editandoEmail !== null}
              />
            </div>
            <div>
              <Rotulo htmlFor="campo-papel">Papel</Rotulo>
              <Selecao id="campo-papel" value={papel} onChange={(e) => setPapel(e.target.value as "admin" | "usuario")}>
                <option value="usuario">Usuário</option>
                <option value="admin">Admin</option>
              </Selecao>
            </div>
          </div>
          <div>
            <Rotulo htmlFor="campo-nome">Nome</Rotulo>
            <CampoTexto
              id="campo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da pessoa"
            />
          </div>
          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando}>
              {editandoEmail ? "Salvar edição" : "Adicionar usuário"}
            </Botao>
            {editandoEmail && (
              <Botao type="button" variante="secundario" onClick={limparFormulario} disabled={salvando}>
                Cancelar
              </Botao>
            )}
          </div>
          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {carregando ? (
          <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum usuário cadastrado ainda.</p>
        ) : (
          usuarios.map((u) => (
            <Card key={u.email}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-gray-900">{u.nome}</h2>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        u.papel === "admin"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.papel === "admin" ? "Admin" : "Usuário"}
                    </span>
                    {eu?.email === u.email && <span className="text-xs text-gray-400">(você)</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao type="button" variante="secundario" onClick={() => handleEditar(u)}>
                    Editar
                  </Botao>
                  {eu?.email !== u.email && (
                    <Botao type="button" variante="perigo" onClick={() => handleRemover(u)}>
                      Remover
                    </Botao>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
