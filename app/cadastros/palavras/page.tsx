"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { PalavraAbreviacao } from "@/lib/types";
import { usePalavras } from "@/hooks/usePalavras";
import { useExigirAdminSetor } from "@/hooks/useExigirAdminSetor";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaPalavras() {
  // Abreviações são insumo do Abreviador (PRD): só admin do CPED (ou master).
  const liberado = useExigirAdminSetor("CPED");
  const { palavras, carregando, erro: erroCarregamento, adicionar, editar, remover } = usePalavras();

  const [palavraForm, setPalavraForm] = useState("");
  const [abreviacaoForm, setAbreviacaoForm] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");

  const palavrasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return palavras;
    return palavras.filter(
      (item) => item.palavra.toLowerCase().includes(termo) || item.abreviacao.toLowerCase().includes(termo)
    );
  }, [palavras, termoBusca]);

  function limparFormulario() {
    setPalavraForm("");
    setAbreviacaoForm("");
    setEditandoId(null);
    setErro(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const palavra = palavraForm.trim();
    const abreviacao = abreviacaoForm.trim();

    if (!palavra || !abreviacao) {
      setErro("Preencha a palavra e a abreviação.");
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      if (editandoId) {
        await editar(editandoId, { palavra, abreviacao });
      } else {
        await adicionar({ palavra, abreviacao });
      }
      limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(item: PalavraAbreviacao) {
    setEditandoId(item.id);
    setPalavraForm(item.palavra);
    setAbreviacaoForm(item.abreviacao);
    setErro(null);
  }

  async function handleRemover(item: PalavraAbreviacao) {
    const confirmou = window.confirm(`Remover a abreviação de "${item.palavra}"?`);
    if (!confirmou) return;
    try {
      await remover(item.id);
      if (editandoId === item.id) limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  if (!liberado) {
    return <p className="py-10 text-center text-sm text-gray-400">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Palavras / Abreviações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre palavras ou frases e a abreviação correspondente. A lista é compartilhada com toda a equipe — na
          aba Abreviador, toda ocorrência delas no texto é substituída automaticamente.
        </p>
      </div>

      {erroCarregamento && (
        <p role="alert" className="text-sm text-red-600">
          {erroCarregamento}
        </p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Rotulo htmlFor="campo-palavra">Palavra ou frase</Rotulo>
            <CampoTexto
              id="campo-palavra"
              value={palavraForm}
              onChange={(e) => setPalavraForm(e.target.value)}
              placeholder="ex.: Recursos Humanos"
            />
          </div>
          <div className="flex-1">
            <Rotulo htmlFor="campo-abreviacao">Abreviação</Rotulo>
            <CampoTexto
              id="campo-abreviacao"
              value={abreviacaoForm}
              onChange={(e) => setAbreviacaoForm(e.target.value)}
              placeholder="ex.: RH"
            />
          </div>
          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando}>
              {editandoId ? "Salvar edição" : "Adicionar"}
            </Botao>
            {editandoId && (
              <Botao type="button" variante="secundario" onClick={limparFormulario} disabled={salvando}>
                Cancelar
              </Botao>
            )}
          </div>
        </form>
        {erro && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {erro}
          </p>
        )}
      </Card>

      <Card>
        <Rotulo htmlFor="campo-busca">Buscar</Rotulo>
        <CampoTexto
          id="campo-busca"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Filtrar por palavra ou abreviação..."
          className="max-w-sm"
        />

        <div className="mt-4 overflow-x-auto">
          {carregando ? (
            <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
          ) : palavrasFiltradas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {palavras.length === 0 ? "Nenhuma palavra cadastrada ainda." : "Nenhum resultado para essa busca."}
            </p>
          ) : (
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Palavra
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Abreviação
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {palavrasFiltradas.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">{item.palavra}</td>
                    <td className="py-2 pr-4 font-mono text-gray-700">{item.abreviacao}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <Botao type="button" variante="secundario" onClick={() => handleEditar(item)}>
                          Editar
                        </Botao>
                        <Botao type="button" variante="perigo" onClick={() => handleRemover(item)}>
                          Remover
                        </Botao>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
