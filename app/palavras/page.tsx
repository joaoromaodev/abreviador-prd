"use client";

import { useMemo, useState, type FormEvent } from "react";
import { gerarId } from "@/lib/id";
import { STORAGE_KEYS } from "@/lib/constants";
import type { PalavraAbreviacao } from "@/lib/types";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaPalavras() {
  const { value: palavras, setValue: setPalavras, hidratado } = useLocalStorageState<PalavraAbreviacao[]>(
    STORAGE_KEYS.palavras,
    []
  );

  const [palavraForm, setPalavraForm] = useState("");
  const [abreviacaoForm, setAbreviacaoForm] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState("");

  const palavrasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    const lista = [...palavras].sort((a, b) => a.palavra.localeCompare(b.palavra, "pt-BR"));
    if (!termo) return lista;
    return lista.filter(
      (item) => item.palavra.toLowerCase().includes(termo) || item.abreviacao.toLowerCase().includes(termo)
    );
  }, [palavras, termoBusca]);

  function limparFormulario() {
    setPalavraForm("");
    setAbreviacaoForm("");
    setEditandoId(null);
    setErro(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const palavra = palavraForm.trim();
    const abreviacao = abreviacaoForm.trim();

    if (!palavra || !abreviacao) {
      setErro("Preencha a palavra e a abreviação.");
      return;
    }

    const jaExiste = palavras.some(
      (item) => item.palavra.toLowerCase() === palavra.toLowerCase() && item.id !== editandoId
    );
    if (jaExiste) {
      setErro("Essa palavra já está cadastrada.");
      return;
    }

    if (editandoId) {
      setPalavras((atual) =>
        atual.map((item) => (item.id === editandoId ? { ...item, palavra, abreviacao } : item))
      );
    } else {
      setPalavras((atual) => [...atual, { id: gerarId(), palavra, abreviacao }]);
    }

    limparFormulario();
  }

  function handleEditar(item: PalavraAbreviacao) {
    setEditandoId(item.id);
    setPalavraForm(item.palavra);
    setAbreviacaoForm(item.abreviacao);
    setErro(null);
  }

  function handleRemover(item: PalavraAbreviacao) {
    const confirmou = window.confirm(`Remover a abreviação de "${item.palavra}"?`);
    if (!confirmou) return;
    setPalavras((atual) => atual.filter((p) => p.id !== item.id));
    if (editandoId === item.id) limparFormulario();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Palavras / Abreviações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre palavras ou frases e a abreviação correspondente. Na aba Abreviador, toda ocorrência delas no
          texto é substituída automaticamente.
        </p>
      </div>

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
            <Botao type="submit">{editandoId ? "Salvar edição" : "Adicionar"}</Botao>
            {editandoId && (
              <Botao type="button" variante="secundario" onClick={limparFormulario}>
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
          {!hidratado ? (
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
