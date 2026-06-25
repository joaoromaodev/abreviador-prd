"use client";

import { useMemo, useState, type FormEvent } from "react";
import { extrairCampos, rotuloCampo } from "@/lib/template";
import type { TipoPRD } from "@/lib/types";
import { useTipos } from "@/hooks/useTipos";
import { AreaTexto, Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaTipos() {
  const { tipos, carregando, erro: erroCarregamento, adicionar, editar, remover } = useTipos();

  const [nomeForm, setNomeForm] = useState("");
  const [templateForm, setTemplateForm] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const camposDetectados = useMemo(
    () => (templateForm.trim() ? extrairCampos(templateForm) : null),
    [templateForm]
  );

  function limparFormulario() {
    setNomeForm("");
    setTemplateForm("");
    setEditandoId(null);
    setErro(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nome = nomeForm.trim();
    const template = templateForm.trim();
    if (!nome || !template) {
      setErro("Preencha o nome e o texto padrão do tipo.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      if (editandoId) {
        await editar(editandoId, { nome, template });
      } else {
        await adicionar({ nome, template });
      }
      limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(tipo: TipoPRD) {
    setEditandoId(tipo.id);
    setNomeForm(tipo.nome);
    setTemplateForm(tipo.template);
    setErro(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleRemover(tipo: TipoPRD) {
    const confirmou = window.confirm(`Remover o tipo "${tipo.nome}"? Os contratos vinculados a ele continuarão salvos.`);
    if (!confirmou) return;
    try {
      await remover(tipo.id);
      if (editandoId === tipo.id) limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tipos de PRD</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cada tipo guarda o <strong>texto padrão</strong> usado para montar os PRDs. Use marcadores no texto:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-500">
          <li>
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">&lt;&lt;campo&gt;&gt;</code> — campo{" "}
            <strong>mensal</strong>: perguntado a cada PRD (muda todo mês).
          </li>
          <li>
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"{campo}"}</code> — campo do{" "}
            <strong>contrato</strong>: cadastrado uma vez na aba Contratos.
          </li>
          <li>
            Reservados: <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">&lt;&lt;termo&gt;&gt;</code>{" "}
            vira <em>(Nº T.A)</em> quando há termo aditivo;{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"{textotermoadtivo}"}</code> só aparece
            quando o contrato tem termo aditivo (senão o segmento some sozinho). Se um tipo usar{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"{textocontrato}"}</code>, é o oposto:
            aparece só quando <strong>não</strong> há termo aditivo.
          </li>
        </ul>
      </div>

      {erroCarregamento && (
        <p role="alert" className="text-sm text-red-600">
          {erroCarregamento}
        </p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="max-w-md">
            <Rotulo htmlFor="campo-nome-tipo">Nome do tipo</Rotulo>
            <CampoTexto
              id="campo-nome-tipo"
              value={nomeForm}
              onChange={(e) => setNomeForm(e.target.value)}
              placeholder="ex.: Locação de Imóveis"
            />
          </div>
          <div>
            <Rotulo htmlFor="campo-template">Texto padrão</Rotulo>
            <AreaTexto
              id="campo-template"
              rows={8}
              value={templateForm}
              onChange={(e) => setTemplateForm(e.target.value)}
              placeholder="ESFERA:... PLANO INTERNO:<<pi>>, ... CONTRATO Nº {contrato} <<termo>>; ..."
              className="font-mono"
            />
          </div>

          {camposDetectados && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              <p>
                <span className="font-medium text-gray-700">Campos mensais detectados:</span>{" "}
                {camposDetectados.mensais.length > 0
                  ? camposDetectados.mensais.map(rotuloCampo).join(", ")
                  : "nenhum"}
                {camposDetectados.usaTermo ? " + termo aditivo" : ""}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-700">Campos do contrato:</span>{" "}
                {camposDetectados.contrato.length > 0
                  ? camposDetectados.contrato.map(rotuloCampo).join(", ")
                  : "nenhum"}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando}>
              {editandoId ? "Salvar edição" : "Adicionar tipo"}
            </Botao>
            {editandoId && (
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
        ) : tipos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum tipo cadastrado ainda.</p>
        ) : (
          tipos.map((tipo) => (
            <Card key={tipo.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium text-gray-900">{tipo.nome}</h2>
                  <p className="mt-1 max-w-2xl whitespace-pre-wrap break-words font-mono text-xs text-gray-500">
                    {tipo.template}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao type="button" variante="secundario" onClick={() => handleEditar(tipo)}>
                    Editar
                  </Botao>
                  <Botao type="button" variante="perigo" onClick={() => handleRemover(tipo)}>
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
