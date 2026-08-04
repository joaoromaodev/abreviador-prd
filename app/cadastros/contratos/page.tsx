"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  licitacaoSemNumero,
  MODALIDADE_NAO_IMPRESSA,
  MODALIDADES_TERCEIRIZADA,
  TIPOS_LICITACAO,
} from "@/lib/constants";
import { extrairCampos, rotuloCampo, TOKEN_TEXTO_CONTRATO, TOKEN_TEXTO_TA } from "@/lib/template";
import { CAMPOS_EMPENHO } from "@/lib/empenho";
import { hojeISO } from "@/lib/vigencia";
import type { Contrato, ModalidadeContrato } from "@/lib/types";
import { podeEditarBlocoEmpenho, podeEditarBlocoPRD } from "@/lib/setores";
import { useContratos } from "@/hooks/useContratos";
import { useTipos } from "@/hooks/useTipos";
import { useSessao } from "@/components/SessaoProvider";
import { AreaTexto, Botao, CampoTexto, Card, Rotulo, Selecao } from "@/components/ui";
import { EtiquetaVigencia } from "@/components/EtiquetaVigencia";

/** Nome do campo `[[...]]` tratado como licitação (tipo + número) no formulário. */
const CAMPO_LICITACAO = "licitacao";

/** Campos de texto longo ganham um textarea no formulário; o resto, um input de uma linha. */
function ehCampoLongo(nome: string): boolean {
  return /^(texto|obj|desc)/i.test(nome);
}

/** Separa "Pregão Eletrônico nº 07/2023" em { tipo, numero }. Sem " nº ", tudo é o tipo (ex.: Dispensa). */
function analisarLicitacao(valor: string): { tipo: string; numero: string } {
  const [tipo = "", numero = ""] = valor.split(" nº ");
  return { tipo: tipo.trim(), numero: numero.trim() };
}

/** Monta a string final da licitação. Dispensa não leva número; os demais levam quando informado. */
function comporLicitacao(tipo: string, numero: string): string {
  if (!tipo) return "";
  if (licitacaoSemNumero(tipo)) return tipo;
  return numero.trim() ? `${tipo} nº ${numero.trim()}` : tipo;
}

/** Seleção do tipo de licitação + caixa de número (que some no tipo sem número). */
function CampoLicitacao({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { tipo, numero } = analisarLicitacao(value);
  const temNumero = tipo !== "" && !licitacaoSemNumero(tipo);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Selecao id={id} value={tipo} onChange={(e) => onChange(comporLicitacao(e.target.value, numero))}>
        <option value="">Selecione o tipo</option>
        {TIPOS_LICITACAO.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Selecao>
      {temNumero && (
        <CampoTexto
          id={`${id}-numero`}
          value={numero}
          onChange={(e) => onChange(comporLicitacao(tipo, e.target.value))}
          placeholder="nº da licitação (ex.: 07/2023)"
          aria-label="Número da licitação"
        />
      )}
    </div>
  );
}

const ESTADO_INICIAL = {
  tipoId: "",
  nome: "",
  temTermoAditivo: false,
  quantidade: "1",
  vigenciaInicio: "",
  vigenciaFim: "",
  vigenciaIndeterminada: false,
};

export default function PaginaContratos() {
  const { usuario } = useSessao();
  // Autorização por bloco: CEO edita só o Empenho, CPED só o PRD, master edita os dois.
  // Os campos-base (identificação, vigência, termo aditivo) aparecem para qualquer admin/master.
  const podePRD = usuario ? podeEditarBlocoPRD(usuario) : false;
  const podeEmpenho = usuario ? podeEditarBlocoEmpenho(usuario) : false;
  const isMaster = usuario?.papel === "master";

  const { tipos, carregando: carregandoTipos } = useTipos();
  const { contratos, carregando, erro: erroCarregamento, adicionar, editar, remover } = useContratos();

  const [tipoId, setTipoId] = useState(ESTADO_INICIAL.tipoId);
  const [nome, setNome] = useState(ESTADO_INICIAL.nome);
  const [temTermoAditivo, setTemTermoAditivo] = useState(ESTADO_INICIAL.temTermoAditivo);
  const [quantidade, setQuantidade] = useState(ESTADO_INICIAL.quantidade);
  const [vigenciaInicio, setVigenciaInicio] = useState(ESTADO_INICIAL.vigenciaInicio);
  const [vigenciaFim, setVigenciaFim] = useState(ESTADO_INICIAL.vigenciaFim);
  const [vigenciaIndeterminada, setVigenciaIndeterminada] = useState(ESTADO_INICIAL.vigenciaIndeterminada);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [modalidades, setModalidades] = useState<ModalidadeContrato[]>([]);
  const [dadosEmpenho, setDadosEmpenho] = useState<Record<string, string>>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const hoje = useMemo(() => hojeISO(), []);
  const tiposPorId = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos]);
  const tipoSelecionado = tiposPorId.get(tipoId) ?? null;

  // Busca por nome/número do contrato (o campo "nome" já junta os dois, ex.: "Sede - 123/2020").
  const contratosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contratos;
    return contratos.filter((c) => c.nome.toLowerCase().includes(termo));
  }, [contratos, busca]);

  // Campos do contrato derivados do template do tipo escolhido. "Texto do contrato" e "Texto do
  // termo aditivo" saem da lista normal: são mutuamente exclusivos e controlados pelo checkbox.
  const { camposNormais, usaTextoContrato, usaTextoTA, camposModalidade, usaModalidades } = useMemo(() => {
    if (!tipoSelecionado) {
      return {
        camposNormais: [] as string[],
        usaTextoContrato: false,
        usaTextoTA: false,
        camposModalidade: [] as string[],
        usaModalidades: false,
      };
    }
    const { contrato, modalidades: camposMod, usaModalidade } = extrairCampos(tipoSelecionado.template);
    return {
      camposNormais: contrato.filter((c) => c !== TOKEN_TEXTO_CONTRATO && c !== TOKEN_TEXTO_TA),
      usaTextoContrato: contrato.includes(TOKEN_TEXTO_CONTRATO),
      usaTextoTA: contrato.includes(TOKEN_TEXTO_TA),
      camposModalidade: camposMod,
      usaModalidades: usaModalidade,
    };
  }, [tipoSelecionado]);

  function limparFormulario() {
    setTipoId(ESTADO_INICIAL.tipoId);
    setNome(ESTADO_INICIAL.nome);
    setTemTermoAditivo(ESTADO_INICIAL.temTermoAditivo);
    setQuantidade(ESTADO_INICIAL.quantidade);
    setVigenciaInicio(ESTADO_INICIAL.vigenciaInicio);
    setVigenciaFim(ESTADO_INICIAL.vigenciaFim);
    setVigenciaIndeterminada(ESTADO_INICIAL.vigenciaIndeterminada);
    setValores({});
    setModalidades([]);
    setDadosEmpenho({});
    setEditandoId(null);
    setErro(null);
  }

  function setValor(campo: string, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function setDadoEmpenho(campo: string, valor: string) {
    setDadosEmpenho((atual) => ({ ...atual, [campo]: valor }));
  }

  function adicionarModalidade() {
    setModalidades((atual) => [...atual, { nome: "", valores: {} }]);
  }

  function removerModalidade(indice: number) {
    setModalidades((atual) => atual.filter((_, i) => i !== indice));
  }

  function setModalidadeNome(indice: number, nome: string) {
    setModalidades((atual) => atual.map((m, i) => (i === indice ? { ...m, nome } : m)));
  }

  function setModalidadeValor(indice: number, campo: string, valor: string) {
    setModalidades((atual) =>
      atual.map((m, i) => (i === indice ? { ...m, valores: { ...m.valores, [campo]: valor } } : m))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (podePRD && !tipoId) {
      setErro("Selecione a categoria do contrato.");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe uma identificação para o contrato.");
      return;
    }
    if (podePRD && usaModalidades && modalidades.length === 0) {
      setErro("Este tipo exige ao menos uma modalidade. Adicione uma abaixo.");
      return;
    }
    if (podePRD && usaModalidades && modalidades.some((m) => !m.nome.trim())) {
      setErro("Dê um nome a cada modalidade (ex.: Ensino Fundamental).");
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

    // Modalidades: guarda só os campos [[...]] do tipo, em cada modalidade cadastrada.
    const modalidadesFinais: ModalidadeContrato[] = usaModalidades
      ? modalidades.map((m) => {
          const valoresMod: Record<string, string> = {};
          for (const campo of camposModalidade) valoresMod[campo] = (m.valores[campo] ?? "").trim();
          return { nome: m.nome.trim(), valores: valoresMod };
        })
      : [];

    const quantidadeNum = temTermoAditivo ? Math.max(1, Number(quantidade) || 1) : 0;

    // Bloco de empenho (CEO): guarda só as chaves do schema, aparadas.
    const dadosEmpenhoFinais: Record<string, string> = {};
    for (const { chave } of CAMPOS_EMPENHO) {
      const valor = (dadosEmpenho[chave] ?? "").trim();
      if (valor) dadosEmpenhoFinais[chave] = valor;
    }

    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        tipoId,
        nome: nome.trim(),
        temTermoAditivo,
        quantidadeTermosAditivos: quantidadeNum,
        vigenciaInicio,
        vigenciaFim: vigenciaIndeterminada ? "" : vigenciaFim,
        vigenciaIndeterminada,
        valores: valoresFinais,
        modalidades: modalidadesFinais,
        dadosEmpenho: dadosEmpenhoFinais,
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
    setVigenciaIndeterminada(contrato.vigenciaIndeterminada ?? false);
    setValores(contrato.valores);
    setModalidades(contrato.modalidades ?? []);
    setDadosEmpenho(contrato.dadosEmpenho ?? {});
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
          <code className="rounded bg-gray-100 px-1 font-mono text-gray-700">{"{ }"}</code> da categoria na hora de
          gerar o PRD.
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
            {podePRD && (
              <div>
                <Rotulo htmlFor="campo-tipo">Categoria</Rotulo>
                <Selecao
                  id="campo-tipo"
                  value={tipoId}
                  onChange={(e) => setTipoId(e.target.value)}
                  disabled={carregandoTipos}
                >
                  <option value="">{carregandoTipos ? "Carregando..." : "Selecione a categoria"}</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </Selecao>
                <p className="mt-1 text-xs text-gray-500">
                  Categoria do contrato (Locação, Terceirizada, Consumo, Obra, Convênio…). Categorias com modelo de
                  PRD geram PRD no CPED; as demais servem só para o empenho.
                </p>
              </div>
            )}
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
                disabled={vigenciaIndeterminada}
              />
              <label className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={vigenciaIndeterminada}
                  onChange={(e) => setVigenciaIndeterminada(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Prazo indeterminado (sem data de fim)
              </label>
              <p className="mt-1 text-xs text-gray-500">
                {vigenciaIndeterminada
                  ? "Contrato sem data de fim: nunca será marcado como vencido."
                  : "Usada para avisar quando o contrato está vencendo ou expirado."}
              </p>
            </div>
          </div>

          {/* Termo aditivo — dado-base do contrato: qualquer admin/master edita. */}
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
            {podePRD ? (
              <p className="mt-1 text-xs text-gray-500">
                Também define o texto usado no PRD: <strong>sem</strong> termo aditivo usa o texto do contrato;{" "}
                <strong>com</strong> termo aditivo usa o texto do termo aditivo (nunca os dois).
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Marque se o contrato tem termo aditivo e informe o número.</p>
            )}
            {temTermoAditivo && (
              <div className="mt-4 max-w-[12rem]">
                <Rotulo htmlFor="campo-quantidade">Qual o número do termo aditivo?</Rotulo>
                <CampoTexto
                  id="campo-quantidade"
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
                {podePRD && (
                  <p className="mt-1 text-xs text-gray-500">
                    Vira <code className="font-mono">({quantidade || "?"}º T.A)</code> no texto.
                  </p>
                )}
              </div>
            )}
          </div>

          {podePRD && tipoSelecionado && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {camposNormais.map((campo) => {
                  const ehLicitacao = campo === CAMPO_LICITACAO;
                  return (
                    <div key={campo} className={ehLicitacao || ehCampoLongo(campo) ? "sm:col-span-2" : ""}>
                      <Rotulo htmlFor={`campo-${campo}`}>{rotuloCampo(campo)}</Rotulo>
                      {ehLicitacao ? (
                        <CampoLicitacao
                          id={`campo-${campo}`}
                          value={valores[campo] ?? ""}
                          onChange={(v) => setValor(campo, v)}
                        />
                      ) : ehCampoLongo(campo) ? (
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
                  );
                })}
              </div>

              {/* Texto do PRD (contrato ou termo aditivo), conforme o termo aditivo marcado acima. */}
              {(usaTextoContrato || usaTextoTA) && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  {!temTermoAditivo && usaTextoContrato && (
                    <div>
                      <Rotulo htmlFor={`campo-${TOKEN_TEXTO_CONTRATO}`}>{rotuloCampo(TOKEN_TEXTO_CONTRATO)}</Rotulo>
                      <AreaTexto
                        id={`campo-${TOKEN_TEXTO_CONTRATO}`}
                        rows={2}
                        value={valores[TOKEN_TEXTO_CONTRATO] ?? ""}
                        onChange={(e) => setValor(TOKEN_TEXTO_CONTRATO, e.target.value)}
                      />
                    </div>
                  )}
                  {temTermoAditivo && usaTextoTA && (
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

              {usaModalidades && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Modalidades</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Este tipo tem campos que mudam por modalidade dentro do mesmo contrato. Cadastre cada
                        modalidade (ex.: Administrativo, Ensino Médio, Ensino Fundamental) com os seus valores. Na
                        hora de gerar o PRD, o usuário escolhe a modalidade. Use{" "}
                        <strong>{MODALIDADE_NAO_IMPRESSA}</strong> quando o contrato não for de ensino nem
                        administrativo: os valores valem do mesmo jeito, mas o texto do PRD sai sem o trecho
                        &ldquo;MODALIDADE:&rdquo;.
                      </p>
                    </div>
                    <Botao type="button" variante="secundario" onClick={adicionarModalidade}>
                      Adicionar modalidade
                    </Botao>
                  </div>

                  {modalidades.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">Nenhuma modalidade ainda. Adicione ao menos uma.</p>
                  ) : (
                    <div className="mt-4 flex flex-col gap-4">
                      {modalidades.map((modalidade, indice) => (
                        <div key={indice} className="rounded-md border border-gray-200 bg-white px-4 py-3">
                          <div className="flex flex-wrap items-end justify-between gap-2">
                            <div className="min-w-[14rem] flex-1">
                              <Rotulo htmlFor={`modalidade-nome-${indice}`}>Modalidade</Rotulo>
                              <Selecao
                                id={`modalidade-nome-${indice}`}
                                value={modalidade.nome}
                                onChange={(e) => setModalidadeNome(indice, e.target.value)}
                              >
                                <option value="">Selecione a modalidade</option>
                                {MODALIDADES_TERCEIRIZADA.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </Selecao>
                            </div>
                            <Botao type="button" variante="perigo" onClick={() => removerModalidade(indice)}>
                              Remover
                            </Botao>
                          </div>
                          {camposModalidade.length > 0 && (
                            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                              {camposModalidade.map((campo) => {
                                const ehLicitacao = campo === CAMPO_LICITACAO;
                                return (
                                  <div
                                    key={campo}
                                    className={ehLicitacao || ehCampoLongo(campo) ? "sm:col-span-2" : ""}
                                  >
                                    <Rotulo htmlFor={`modalidade-${indice}-${campo}`}>{rotuloCampo(campo)}</Rotulo>
                                    {ehLicitacao ? (
                                      <CampoLicitacao
                                        id={`modalidade-${indice}-${campo}`}
                                        value={modalidade.valores[campo] ?? ""}
                                        onChange={(v) => setModalidadeValor(indice, campo, v)}
                                      />
                                    ) : ehCampoLongo(campo) ? (
                                      <AreaTexto
                                        id={`modalidade-${indice}-${campo}`}
                                        rows={2}
                                        value={modalidade.valores[campo] ?? ""}
                                        onChange={(e) => setModalidadeValor(indice, campo, e.target.value)}
                                      />
                                    ) : (
                                      <CampoTexto
                                        id={`modalidade-${indice}-${campo}`}
                                        value={modalidade.valores[campo] ?? ""}
                                        onChange={(e) => setModalidadeValor(indice, campo, e.target.value)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {podeEmpenho && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3">
            <h3 className="text-sm font-medium text-gray-700">Dados para Empenho (CEO)</h3>
            <p className="mt-1 text-xs text-gray-500">
              Dados que a equipe de empenho (CEO) consulta para lançar a nota de empenho no SIAFE. São
              independentes do tipo de PRD — preencha o que fizer sentido para este contrato. Deixe em branco
              se este contrato não é empenhado aqui.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {CAMPOS_EMPENHO.map((campo) => (
                <div key={campo.chave} className={campo.longo ? "sm:col-span-2" : ""}>
                  <Rotulo htmlFor={`empenho-${campo.chave}`}>{campo.rotulo}</Rotulo>
                  {campo.longo ? (
                    <AreaTexto
                      id={`empenho-${campo.chave}`}
                      rows={2}
                      value={dadosEmpenho[campo.chave] ?? ""}
                      onChange={(e) => setDadoEmpenho(campo.chave, e.target.value)}
                    />
                  ) : (
                    <CampoTexto
                      id={`empenho-${campo.chave}`}
                      value={dadosEmpenho[campo.chave] ?? ""}
                      onChange={(e) => setDadoEmpenho(campo.chave, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="flex gap-2">
            <Botao type="submit" disabled={salvando || (podePRD && !tipoId)}>
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
        {!carregando && contratos.length > 0 && (
          <CampoTexto
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar contrato por nome ou número..."
            aria-label="Pesquisar contratos"
          />
        )}
        {carregando ? (
          <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
        ) : contratos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Nenhum contrato cadastrado ainda.</p>
        ) : contratosFiltrados.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            Nenhum contrato encontrado para “{busca}”.
          </p>
        ) : (
          contratosFiltrados.map((contrato) => (
            <Card key={contrato.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-gray-900">{contrato.nome}</h2>
                    <EtiquetaVigencia
                      vigenciaFim={contrato.vigenciaFim}
                      hoje={hoje}
                      indeterminada={contrato.vigenciaIndeterminada}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {tiposPorId.get(contrato.tipoId)?.nome ?? "Categoria removida"}
                    {contrato.temTermoAditivo
                      ? ` · ${contrato.quantidadeTermosAditivos}º termo aditivo`
                      : " · sem termo aditivo"}
                    {contrato.modalidades.length > 0 &&
                      ` · ${contrato.modalidades.length} modalidade(s): ${contrato.modalidades
                        .map((m) => m.nome)
                        .filter(Boolean)
                        .join(", ")}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao type="button" variante="secundario" onClick={() => handleEditar(contrato)}>
                    Editar
                  </Botao>
                  {isMaster && (
                    <Botao type="button" variante="perigo" onClick={() => handleRemover(contrato)}>
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
