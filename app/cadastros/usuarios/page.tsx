"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/lib/types";
import { ROTULO_SETOR, SETORES, setoresEfetivos, type Setor } from "@/lib/setores";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useSessao } from "@/components/SessaoProvider";
import { Botao, CampoTexto, Card, Rotulo, Selecao } from "@/components/ui";

type Papel = "master" | "admin" | "usuario";

const ROTULO_PAPEL: Record<Papel, string> = {
  master: "Master",
  admin: "Admin",
  usuario: "Usuário",
};

export default function PaginaUsuarios() {
  const router = useRouter();
  const { usuario: eu, isMaster, carregando: carregandoSessao } = useSessao();
  const { usuarios, carregando, erro: erroCarregamento, adicionar, editar, remover } = useUsuarios();

  // Gestão de usuários é exclusiva do master (o layout já esconde a aba; aqui é a trava direta).
  useEffect(() => {
    if (!carregandoSessao && !isMaster) router.replace("/cadastros/contratos");
  }, [carregandoSessao, isMaster, router]);

  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("usuario");
  const [setores, setSetores] = useState<Setor[]>([]);
  const [editandoEmail, setEditandoEmail] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function limparFormulario() {
    setEmail("");
    setNome("");
    setPapel("usuario");
    setSetores([]);
    setEditandoEmail(null);
    setErro(null);
  }

  function alternarSetor(setor: Setor, marcado: boolean) {
    setSetores((atual) => (marcado ? [...new Set([...atual, setor])] : atual.filter((s) => s !== setor)));
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
        await editar(editandoEmail, { nome: nome.trim(), papel, setores });
      } else {
        await adicionar({ email: email.trim().toLowerCase(), nome: nome.trim(), papel, setores });
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
    setSetores((u.setores ?? []).filter((s): s is Setor => (SETORES as readonly string[]).includes(s)));
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

  if (carregandoSessao || !isMaster) {
    return <p className="py-10 text-center text-sm text-gray-400">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Usuários</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quem pode entrar no sistema, com qual papel e em quais setores. <strong>Master</strong> gerencia
          usuários e configurações e edita tudo; <strong>Admin</strong> cadastra/edita os contratos e os cadastros
          do(s) seu(s) setor(es), sem tocar em usuários/configurações; <strong>Usuário</strong> só visualiza. O
          e-mail deve ser o da conta Google da pessoa.
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
              <Selecao id="campo-papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
                <option value="usuario">Usuário</option>
                <option value="admin">Admin</option>
                <option value="master">Master</option>
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
          <div>
            <Rotulo>Setores (módulos e cadastros que a pessoa acessa)</Rotulo>
            {papel === "master" ? (
              <p className="text-sm text-gray-500">O master acessa todos os setores e gerencia todo o sistema.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-gray-500">
                  {papel === "admin"
                    ? "O admin cadastra/edita apenas o bloco do(s) setor(es) marcado(s) (CEO = empenho; CPED = PRD)."
                    : "O usuário visualiza apenas os módulos do(s) setor(es) marcado(s)."}
                </p>
                <div className="flex flex-wrap gap-4">
                  {SETORES.map((setor) => (
                    <label key={setor} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={setores.includes(setor)}
                        onChange={(e) => alternarSetor(setor, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {ROTULO_SETOR[setor]}
                    </label>
                  ))}
                </div>
                {setores.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Sem setor marcado: por retrocompatibilidade o acesso recai em CPED (PRD). Marque explicitamente
                    o(s) setor(es) desejado(s).
                  </p>
                )}
              </>
            )}
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
                        u.papel === "master"
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : u.papel === "admin"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROTULO_PAPEL[u.papel]}
                    </span>
                    {eu?.email === u.email && <span className="text-xs text-gray-400">(você)</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{u.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {u.papel === "master"
                      ? "Todos os setores"
                      : `Setores: ${setoresEfetivos(u.setores).join(", ")}`}
                  </p>
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
