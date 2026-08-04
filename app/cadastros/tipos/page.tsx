"use client";

import { useMemo, useState, type FormEvent } from "react";
import { extrairCampos, rotuloCampo } from "@/lib/template";
import type { TipoPRD } from "@/lib/types";
import { useTipos } from "@/hooks/useTipos";
import { useExigirAdminSetor } from "@/hooks/useExigirAdminSetor";
import { AreaTexto, Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaTipos() {
  // Categorias são insumo de PRD: só admin do CPED (ou master).
  const liberado = useExigirAdminSetor("CPED");
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
    if (!nome) {
      setErro("Informe o nome da categoria.");
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
    const confirmou = window.confirm(`Remover a categoria "${tipo.nome}"? Os contratos vinculados a ela continuarão salvos.`);
    if (!confirmou) return;
    try {
      await remover(tipo.id);
      if (editandoId === tipo.id) limparFormulario();
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
        <h1 className="text-xl font-semibold text-gray-900">Categorias</h1>
        <p className="mt-1 text-sm text-gray-500">
          Categoria do contrato (Locação, Terceirizada, Consumo, Obra, Convênio…). O{" "}
          <strong>texto padrão</strong> (modelo de PRD) é <strong>opcional</strong>: deixe em branco para categorias
          que só são empenhadas (não geram PRD). Quando preenchido, use os marcadores:
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
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"[[campo]]"}</code> — campo por{" "}
            <strong>modalidade</strong>: muda dentro do mesmo contrato (ex.: Administrativo / Ensino Médio / Ensino
            Fundamental). O reservado{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"[[modalidade]]"}</code> vira o nome da
            modalidade escolhida.
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
            <Rotulo htmlFor="campo-nome-tipo">Nome da categoria</Rotulo>
            <CampoTexto
              id="campo-nome-tipo"
              value={nomeForm}
              onChange={(e) => setNomeForm(e.target.value)}
              placeholder="ex.: Locação de Imóveis, Consumo, Obra…"
            />
          </div>
          <div>
            <Rotulo htmlFor="campo-template">Texto padrão do PRD (opcional)</Rotulo>
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
              {camposDetectados.usaModalidade && (
                <p className="mt-1">
                  <span className="font-medium text-gray-700">Campos por modalidade:</span>{" "}
                  {camposDetectados.modalidades.length > 0
                    ? camposDetectados.modalidades.map(rotuloCampo).join(", ")
                    : "nenhum"}
                  {" + nome da modalidade"}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando}>
              {editandoId ? "Salvar edição" : "Adicionar categoria"}
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
          <p className="py-6 text-center text-sm text-gray-400">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          tipos.map((tipo) => (
            <Card key={tipo.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium text-gray-900">{tipo.nome}</h2>
                  {tipo.template.trim() ? (
                    <p className="mt-1 max-w-2xl whitespace-pre-wrap break-words font-mono text-xs text-gray-500">
                      {tipo.template}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-gray-400">Sem modelo de PRD (categoria só de empenho).</p>
                  )}
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
