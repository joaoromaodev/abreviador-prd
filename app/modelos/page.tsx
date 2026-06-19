"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { gerarId } from "@/lib/id";
import { STORAGE_KEYS } from "@/lib/constants";
import { writeStorage } from "@/lib/storage";
import type { ModeloPRD } from "@/lib/types";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { AreaTexto, Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaModelos() {
  const router = useRouter();
  const { value: modelos, setValue: setModelos, hidratado } = useLocalStorageState<ModeloPRD[]>(
    STORAGE_KEYS.modelos,
    []
  );

  const [nomeForm, setNomeForm] = useState("");
  const [conteudoForm, setConteudoForm] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function limparFormulario() {
    setNomeForm("");
    setConteudoForm("");
    setEditandoId(null);
    setErro(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nome = nomeForm.trim();
    const conteudo = conteudoForm.trim();

    if (!nome || !conteudo) {
      setErro("Preencha o nome e o conteúdo do modelo.");
      return;
    }

    const agora = new Date().toISOString();

    if (editandoId) {
      setModelos((atual) =>
        atual.map((m) => (m.id === editandoId ? { ...m, nome, conteudo, atualizadoEm: agora } : m))
      );
    } else {
      setModelos((atual) => [
        ...atual,
        { id: gerarId(), nome, conteudo, criadoEm: agora, atualizadoEm: agora },
      ]);
    }

    limparFormulario();
  }

  function handleEditar(modelo: ModeloPRD) {
    setEditandoId(modelo.id);
    setNomeForm(modelo.nome);
    setConteudoForm(modelo.conteudo);
    setErro(null);
  }

  function handleRemover(modelo: ModeloPRD) {
    const confirmou = window.confirm(`Remover o modelo "${modelo.nome}"?`);
    if (!confirmou) return;
    setModelos((atual) => atual.filter((m) => m.id !== modelo.id));
    if (editandoId === modelo.id) limparFormulario();
  }

  function handleUsarComoModelo(modelo: ModeloPRD) {
    writeStorage(STORAGE_KEYS.rascunho, modelo.conteudo);
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Modelos de PRDs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Salve modelos prontos de PRD e carregue um deles como ponto de partida na aba Abreviador.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="max-w-md">
            <Rotulo htmlFor="campo-nome-modelo">Nome do modelo</Rotulo>
            <CampoTexto
              id="campo-nome-modelo"
              value={nomeForm}
              onChange={(e) => setNomeForm(e.target.value)}
              placeholder="ex.: PRD padrão de feature"
            />
          </div>
          <div>
            <Rotulo htmlFor="campo-conteudo-modelo">Conteúdo</Rotulo>
            <AreaTexto
              id="campo-conteudo-modelo"
              rows={8}
              value={conteudoForm}
              onChange={(e) => setConteudoForm(e.target.value)}
              placeholder="Texto base do modelo de PRD..."
            />
          </div>
          <div className="flex gap-2">
            <Botao type="submit">{editandoId ? "Salvar edição" : "Adicionar modelo"}</Botao>
            {editandoId && (
              <Botao type="button" variante="secundario" onClick={limparFormulario}>
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
        {!hidratado ? (
          <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
        ) : modelos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum modelo salvo ainda.</p>
        ) : (
          modelos.map((modelo) => (
            <Card key={modelo.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-gray-900">{modelo.nome}</h2>
                  <p className="mt-1 line-clamp-3 max-w-2xl whitespace-pre-wrap text-sm text-gray-500">
                    {modelo.conteudo}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao type="button" onClick={() => handleUsarComoModelo(modelo)}>
                    Usar como modelo
                  </Botao>
                  <Botao type="button" variante="secundario" onClick={() => handleEditar(modelo)}>
                    Editar
                  </Botao>
                  <Botao type="button" variante="perigo" onClick={() => handleRemover(modelo)}>
                    Remover
                  </Botao>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
