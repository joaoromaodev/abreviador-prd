"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { writeStorage } from "@/lib/storage";
import { extrairCampos, renderizar, rotuloCampo } from "@/lib/template";
import { analisarVigencia, formatarData, hojeISO } from "@/lib/vigencia";
import { useContratos } from "@/hooks/useContratos";
import { useTipos } from "@/hooks/useTipos";
import { Botao, CampoTexto, Card, Rotulo, Selecao } from "@/components/ui";

export default function PaginaGerar() {
  const router = useRouter();
  const { tipos, carregando: carregandoTipos, erro: erroTipos } = useTipos();
  const { contratos, carregando: carregandoContratos, erro: erroContratos } = useContratos();

  const [tipoId, setTipoId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [valoresMensais, setValoresMensais] = useState<Record<string, string>>({});
  const [modalidadeIndice, setModalidadeIndice] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [gerarMesmoAssim, setGerarMesmoAssim] = useState(false);

  const hoje = useMemo(() => hojeISO(), []);
  // Só categorias com template geram PRD; as sem template (só empenho) não aparecem aqui.
  const tiposComTemplate = useMemo(() => tipos.filter((t) => t.template.trim() !== ""), [tipos]);
  const tipoSelecionado = useMemo(() => tipos.find((t) => t.id === tipoId) ?? null, [tipos, tipoId]);
  const contratosDoTipo = useMemo(
    () => (tipoId ? contratos.filter((c) => c.tipoId === tipoId) : []),
    [contratos, tipoId]
  );
  const contratoSelecionado = useMemo(
    () => contratosDoTipo.find((c) => c.id === contratoId) ?? null,
    [contratosDoTipo, contratoId]
  );

  const { camposMensais, usaModalidades } = useMemo(() => {
    if (!tipoSelecionado) return { camposMensais: [] as string[], usaModalidades: false };
    const campos = extrairCampos(tipoSelecionado.template);
    return { camposMensais: campos.mensais, usaModalidades: campos.usaModalidade };
  }, [tipoSelecionado]);

  const modalidadesDoContrato = contratoSelecionado?.modalidades ?? [];
  const modalidadeSelecionada =
    usaModalidades && modalidadeIndice !== "" ? modalidadesDoContrato[Number(modalidadeIndice)] ?? null : null;
  // Quando o tipo usa modalidades, exige escolher uma antes de montar o texto.
  const faltaModalidade = usaModalidades && !modalidadeSelecionada;

  const vigencia = useMemo(
    () => (contratoSelecionado ? analisarVigencia(contratoSelecionado.vigenciaFim, hoje) : null),
    [contratoSelecionado, hoje]
  );
  // Contrato expirado: avisa e só libera a geração se o usuário confirmar.
  const bloqueadoPorVigencia = vigencia?.status === "expirado" && !gerarMesmoAssim;

  const resultado = useMemo(() => {
    if (!tipoSelecionado || !contratoSelecionado) return null;
    if (faltaModalidade) return null;
    return renderizar(tipoSelecionado.template, {
      valoresMensais,
      valoresContrato: contratoSelecionado.valores,
      valoresModalidade: modalidadeSelecionada?.valores,
      nomeModalidade: modalidadeSelecionada?.nome,
      temTermoAditivo: contratoSelecionado.temTermoAditivo,
      quantidadeTermosAditivos: contratoSelecionado.quantidadeTermosAditivos,
    });
  }, [tipoSelecionado, contratoSelecionado, valoresMensais, faltaModalidade, modalidadeSelecionada]);

  function handleTrocarTipo(novoTipoId: string) {
    setTipoId(novoTipoId);
    setContratoId("");
    setValoresMensais({});
    setModalidadeIndice("");
    setCopiado(false);
    setGerarMesmoAssim(false);
  }

  function handleTrocarContrato(novoContratoId: string) {
    setContratoId(novoContratoId);
    setModalidadeIndice("");
    setCopiado(false);
    setGerarMesmoAssim(false);
  }

  function setValorMensal(campo: string, valor: string) {
    setValoresMensais((atual) => ({ ...atual, [campo]: valor }));
    setCopiado(false);
  }

  async function handleCopiar() {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard indisponível — usuário pode selecionar manualmente.
    }
  }

  function handleEnviarAbreviador() {
    if (!resultado) return;
    writeStorage(STORAGE_KEYS.rascunho, resultado);
    router.push("/");
  }

  const semTipos = !carregandoTipos && tiposComTemplate.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Modelos de PRD</h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha o tipo e o contrato, preencha os campos do mês e o texto é montado automaticamente. Depois, envie
          direto para o Abreviador.
        </p>
      </div>

      {(erroTipos || erroContratos) && (
        <p role="alert" className="text-sm text-red-600">
          {erroTipos ?? erroContratos}
        </p>
      )}

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Rotulo htmlFor="gerar-tipo">Categoria</Rotulo>
            <Selecao
              id="gerar-tipo"
              value={tipoId}
              onChange={(e) => handleTrocarTipo(e.target.value)}
              disabled={carregandoTipos}
            >
              <option value="">{carregandoTipos ? "Carregando..." : "Selecione uma categoria"}</option>
              {tiposComTemplate.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </Selecao>
          </div>
          <div>
            <Rotulo htmlFor="gerar-contrato">Contrato</Rotulo>
            <Selecao
              id="gerar-contrato"
              value={contratoId}
              onChange={(e) => handleTrocarContrato(e.target.value)}
              disabled={!tipoSelecionado || carregandoContratos}
            >
              <option value="">
                {!tipoSelecionado
                  ? "Escolha a categoria primeiro"
                  : carregandoContratos
                    ? "Carregando..."
                    : contratosDoTipo.length === 0
                      ? "Nenhum contrato desta categoria"
                      : "Selecione um contrato"}
              </option>
              {contratosDoTipo.map((contrato) => (
                <option key={contrato.id} value={contrato.id}>
                  {contrato.nome}
                </option>
              ))}
            </Selecao>
          </div>
        </div>

        {semTipos && (
          <p className="mt-4 text-sm text-gray-500">
            Nenhuma categoria com modelo de PRD ainda. Crie uma em <strong>Cadastros → Categorias</strong>.
          </p>
        )}

        {tipoSelecionado && contratosDoTipo.length === 0 && !carregandoContratos && (
          <p className="mt-4 text-sm text-gray-500">
            Esta categoria ainda não tem contratos. Cadastre um em <strong>Cadastros → Contratos</strong>.
          </p>
        )}

        {contratoSelecionado &&
          (contratoSelecionado.vigenciaIndeterminada ? (
            <p className="mt-4 text-sm text-blue-700">Contrato com prazo indeterminado (sem data de fim).</p>
          ) : vigencia ? (
          <>
            {vigencia.status === "expirado" && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold">
                  Contrato expirado em {formatarData(contratoSelecionado.vigenciaFim)} (há{" "}
                  {Math.abs(vigencia.diasRestantes ?? 0)} dia(s)).
                </p>
                <p className="mt-1">Recomendamos não gerar PRD para um contrato vencido.</p>
                <label className="mt-3 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={gerarMesmoAssim}
                    onChange={(e) => setGerarMesmoAssim(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  Gerar mesmo assim
                </label>
              </div>
            )}
            {vigencia.status === "vencendo" && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Atenção: este contrato vence em {formatarData(contratoSelecionado.vigenciaFim)} (faltam{" "}
                {vigencia.diasRestantes} dia(s)).
              </div>
            )}
            {vigencia.status === "vigente" && (
              <p className="mt-4 text-sm text-green-700">
                Contrato vigente até {formatarData(contratoSelecionado.vigenciaFim)}.
              </p>
            )}
            {vigencia.status === "sem_data" && (
              <p className="mt-4 text-sm text-gray-500">Vigência não informada para este contrato.</p>
            )}
          </>
          ) : null)}

        {contratoSelecionado && usaModalidades && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <Rotulo htmlFor="gerar-modalidade">Modalidade</Rotulo>
            {modalidadesDoContrato.length === 0 ? (
              <p className="mt-1 text-sm text-amber-700">
                Este contrato não tem modalidades cadastradas. Cadastre-as em{" "}
                <strong>Cadastros → Contratos</strong> antes de gerar.
              </p>
            ) : (
              <Selecao
                id="gerar-modalidade"
                value={modalidadeIndice}
                onChange={(e) => {
                  setModalidadeIndice(e.target.value);
                  setCopiado(false);
                }}
              >
                <option value="">Selecione a modalidade</option>
                {modalidadesDoContrato.map((modalidade, indice) => (
                  <option key={indice} value={String(indice)}>
                    {modalidade.nome || `Modalidade ${indice + 1}`}
                  </option>
                ))}
              </Selecao>
            )}
          </div>
        )}

        {contratoSelecionado && camposMensais.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h2 className="text-sm font-medium text-gray-700">Campos do mês</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {camposMensais.map((campo) => (
                <div key={campo}>
                  <Rotulo htmlFor={`mensal-${campo}`}>{rotuloCampo(campo)}</Rotulo>
                  <CampoTexto
                    id={`mensal-${campo}`}
                    value={valoresMensais[campo] ?? ""}
                    onChange={(e) => setValorMensal(campo, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {resultado !== null && !bloqueadoPorVigencia && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Rotulo htmlFor="gerar-resultado" className="mb-0">
              Texto gerado
            </Rotulo>
            <span className="text-sm text-gray-500">{resultado.length} caracteres</span>
          </div>
          <p
            id="gerar-resultado"
            className="mt-3 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800"
          >
            {resultado}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao type="button" onClick={handleEnviarAbreviador}>
              Enviar para o Abreviador
            </Botao>
            <Botao type="button" variante="secundario" onClick={handleCopiar}>
              {copiado ? "Copiado!" : "Copiar texto"}
            </Botao>
          </div>
        </Card>
      )}
    </div>
  );
}
