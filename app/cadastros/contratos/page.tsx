"use client";

import { useMemo, useState, type FormEvent } from "react";
import { extrairCampos, rotuloCampo, TOKEN_TEXTO_CONTRATO, TOKEN_TEXTO_TA } from "@/lib/template";
import { hojeISO } from "@/lib/vigencia";
import type { Contrato } from "@/lib/types";
import { useContratos } from "@/hooks/useContratos";
import { useTipos } from "@/hooks/useTipos";
import { AreaTexto, Botao, CampoTexto, Card, Rotulo, Selecao } from "@/components/ui";
import { EtiquetaVigencia } from "@/components/EtiquetaVigencia";

/** Campos de texto longo ganham um textarea no formulário; o resto, um input de uma linha. */
function ehCampoLongo(nome: string): boolean {
  return /^(texto|obj|desc)/i.test(nome);
}

const ESTADO_INICIAL = {
  tipoId: "",
  nome: "",
  temTermoAditivo: false,
  quantidade: "1",
  vigenciaInicio: "",
  vigenciaFim: "",
};

export default function PaginaContratos() {
  const { tipos, carregando: carregandoTipos } = useTipos();
  const { contratos, carregando, erro: erroCarregamento, adicionar, editar, remover } = useContratos();

  const [tipoId, setTipoId] = useState(ESTADO_INICIAL.tipoId);
  const [nome, setNome] = useState(ESTADO_INICIAL.nome);
  const [temTermoAditivo, setTemTermoAditivo] = useState(ESTADO_INICIAL.temTermoAditivo);
  const [quantidade, setQuantidade] = useState(ESTADO_INICIAL.quantidade);
  const [vigenciaInicio, setVigenciaInicio] = useState(ESTADO_INICIAL.vigenciaInicio);
  const [vigenciaFim, setVigenciaFim] = useState(ESTADO_INICIAL.vigenciaFim);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const hoje = useMemo(() => hojeISO(), []);
  const tiposPorId = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos]);
  const tipoSelecionado = tiposPorId.get(tipoId) ?? null;

  // Campos do contrato derivados do template do tipo escolhido. "Texto do contrato" e "Texto do
  // termo aditivo" saem da lista normal: são mutuamente exclusivos e controlados pelo checkbox.
  const { camposNormais, usaTextoContrato, usaTextoTA } = useMemo(() => {
    if (!tipoSelecionado) {
      return { camposNormais: [] as string[], usaTextoContrato: false, usaTextoTA: false };
    }
    const { contrato } = extrairCampos(tipoSelecionado.template);
    return {
      camposNormais: contrato.filter((c) => c !== TOKEN_TEXTO_CONTRATO && c !== TOKEN_TEXTO_TA),
      usaTextoContrato: contrato.includes(TOKEN_TEXTO_CONTRATO),
      usaTextoTA: contrato.includes(TOKEN_TEXTO_TA),
    };
  }, [tipoSelecionado]);

  function limparFormulario() {
    setTipoId(ESTADO_INICIAL.tipoId);
    setNome(ESTADO_INICIAL.nome);
    setTemTermoAditivo(ESTADO_INICIAL.temTermoAditivo);
    setQuantidade(ESTADO_INICIAL.quantidade);
    setVigenciaInicio(ESTADO_INICIAL.vigenciaInicio);
    setVigenciaFim(ESTADO_INICIAL.vigenciaFim);
    setValores({});
    setEditandoId(null);
    setErro(null);
  }

  function setValor(campo: string, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tipoId) {
      setErro("Selecione o tipo do contrato.");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe uma identificação para o contrato.");
      return;
    }

    // Monta os valores apenas com os campos do tipo escolhido (mantém a planilha limpa).
    // Texto do contrato OU do termo aditivo, conforme o checkbox — nunca os dois.
    const valoresFinais: Record<string, string> = {};
    for (const campo of camposNormais) valoresFinais[campo] = (valores[campo] ?? "").trim();
    if (temTermoAditivo) {
      if (usaTextoTA) valoresFinais[TOKEN_TEXTO_TA] = (valores[TOKEN_TEXTO_TA] ?? "").trim();
    } else if (usaTextoContrato) {
      valoresFinais[TOKEN_TEXTO_CONTRATO] = (valores[TOKEN_TEXTO_CONTRATO] ?? "").trim();
    }

    const quantidadeNum = temTermoAditivo ? Math.max(1, Number(quantidade) || 1) : 0;

    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        tipoId,
        nome: nome.trim(),
        temTermoAditivo,
        quantidadeTermosAditivos: quantidadeNum,
        vigenciaInicio,
        vigenciaFim,
        valores: valoresFinais,
      };
      if (editandoId) {
        await editar(editandoId, dados);
      } else {
        await adicionar(dados);
      }
      limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(contrato: Contrato) {
    setEditandoId(contrato.id);
    setTipoId(contrato.tipoId);
    setNome(contrato.nome);
    setTemTermoAditivo(contrato.temTermoAditivo);
    setQuantidade(String(contrato.quantidadeTermosAditivos || 1));
    setVigenciaInicio(contrato.vigenciaInicio ?? "");
    setVigenciaFim(contrato.vigenciaFim ?? "");
    setValores(contrato.valores);
    setErro(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleRemover(contrato: Contrato) {
    const confirmou = window.confirm(`Remover o contrato "${contrato.nome}"?`);
    if (!confirmou) return;
    try {
      await remover(contrato.id);
      if (editandoId === contrato.id) limparFormulario();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Contratos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre os contratos e as informações fixas de cada um. Esses dados preenchem automaticamente os campos{" "}
          <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"{ }"}</code> do tipo na hora de gerar o
          PRD.
        </p>
      </div>

      {erroCarregamento && (
        <p role="alert" className="text-sm text-red-600">
          {erroCarregamento}
        </p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="campo-tipo">Tipo</Rotulo>
              <Selecao
                id="campo-tipo"
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                disabled={carregandoTipos}
              >
                <option value="">{carregandoTipos ? "Carregando..." : "Selecione um tipo"}</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </Selecao>
            </div>
            <div>
              <Rotulo htmlFor="campo-identificacao">Identificação do contrato</Rotulo>
              <CampoTexto
                id="campo-identificacao"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="ex.: Sede Administrativa - 123/2020"
              />
            </div>
            <div>
              <Rotulo htmlFor="campo-vigencia-inicio">Vigência — início</Rotulo>
              <CampoTexto
                id="campo-vigencia-inicio"
                type="date"
                value={vigenciaInicio}
                onChange={(e) => setVigenciaInicio(e.target.value)}
              />
            </div>
            <div>
              <Rotulo htmlFor="campo-vigencia-fim">Vigência — fim</Rotulo>
              <CampoTexto
                id="campo-vigencia-fim"
                type="date"
                value={vigenciaFim}
                onChange={(e) => setVigenciaFim(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Usada para avisar quando o contrato está vencendo ou expirado.
              </p>
            </div>
          </div>

          {tipoSelecionado && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {camposNormais.map((campo) => (
                  <div key={campo} className={ehCampoLongo(campo) ? "sm:col-span-2" : ""}>
                    <Rotulo htmlFor={`campo-${campo}`}>{rotuloCampo(campo)}</Rotulo>
                    {ehCampoLongo(campo) ? (
                      <AreaTexto
                        id={`campo-${campo}`}
                        rows={2}
                        value={valores[campo] ?? ""}
                        onChange={(e) => setValor(campo, e.target.value)}
                      />
                    ) : (
                      <CampoTexto
                        id={`campo-${campo}`}
                        value={valores[campo] ?? ""}
                        onChange={(e) => setValor(campo, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={temTermoAditivo}
                    onChange={(e) => setTemTermoAditivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Este contrato tem termo aditivo
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Define o texto usado no PRD: <strong>sem</strong> termo aditivo usa o texto do contrato;{" "}
                  <strong>com</strong> termo aditivo usa o texto do termo aditivo (nunca os dois).
                </p>

                {!temTermoAditivo && usaTextoContrato && (
                  <div className="mt-4">
                    <Rotulo htmlFor={`campo-${TOKEN_TEXTO_CONTRATO}`}>{rotuloCampo(TOKEN_TEXTO_CONTRATO)}</Rotulo>
                    <AreaTexto
                      id={`campo-${TOKEN_TEXTO_CONTRATO}`}
                      rows={2}
                      value={valores[TOKEN_TEXTO_CONTRATO] ?? ""}
                      onChange={(e) => setValor(TOKEN_TEXTO_CONTRATO, e.target.value)}
                    />
                  </div>
                )}

                {temTermoAditivo && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="max-w-[12rem]">
                      <Rotulo htmlFor="campo-quantidade">Qual o número do termo aditivo?</Rotulo>
                      <CampoTexto
                        id="campo-quantidade"
                        type="number"
                        min={1}
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Vira <code className="font-mono">({quantidade || "?"}º T.A)</code> no texto.
                      </p>
                    </div>
                    {usaTextoTA && (
                      <div>
                        <Rotulo htmlFor={`campo-${TOKEN_TEXTO_TA}`}>{rotuloCampo(TOKEN_TEXTO_TA)}</Rotulo>
                        <AreaTexto
                          id={`campo-${TOKEN_TEXTO_TA}`}
                          rows={2}
                          value={valores[TOKEN_TEXTO_TA] ?? ""}
                          onChange={(e) => setValor(TOKEN_TEXTO_TA, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando || !tipoId}>
              {editandoId ? "Salvar edição" : "Adicionar contrato"}
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
        ) : contratos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum contrato cadastrado ainda.</p>
        ) : (
          contratos.map((contrato) => (
            <Card key={contrato.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-gray-900">{contrato.nome}</h2>
                    <EtiquetaVigencia vigenciaFim={contrato.vigenciaFim} hoje={hoje} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {tiposPorId.get(contrato.tipoId)?.nome ?? "Tipo removido"}
                    {contrato.temTermoAditivo
                      ? ` · ${contrato.quantidadeTermosAditivos}º termo aditivo`
                      : " · sem termo aditivo"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao type="button" variante="secundario" onClick={() => handleEditar(contrato)}>
                    Editar
                  </Botao>
                  <Botao type="button" variante="perigo" onClick={() => handleRemover(contrato)}>
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
