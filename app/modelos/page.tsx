"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { writeStorage } from "@/lib/storage";
import { extrairCampos, renderizar, rotuloCampo } from "@/lib/template";
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
  const [copiado, setCopiado] = useState(false);

  const tipoSelecionado = useMemo(() => tipos.find((t) => t.id === tipoId) ?? null, [tipos, tipoId]);
  const contratosDoTipo = useMemo(
    () => (tipoId ? contratos.filter((c) => c.tipoId === tipoId) : []),
    [contratos, tipoId]
  );
  const contratoSelecionado = useMemo(
    () => contratosDoTipo.find((c) => c.id === contratoId) ?? null,
    [contratosDoTipo, contratoId]
  );

  const camposMensais = useMemo(
    () => (tipoSelecionado ? extrairCampos(tipoSelecionado.template).mensais : []),
    [tipoSelecionado]
  );

  const resultado = useMemo(() => {
    if (!tipoSelecionado || !contratoSelecionado) return null;
    return renderizar(tipoSelecionado.template, {
      valoresMensais,
      valoresContrato: contratoSelecionado.valores,
      temTermoAditivo: contratoSelecionado.temTermoAditivo,
      quantidadeTermosAditivos: contratoSelecionado.quantidadeTermosAditivos,
    });
  }, [tipoSelecionado, contratoSelecionado, valoresMensais]);

  function handleTrocarTipo(novoTipoId: string) {
    setTipoId(novoTipoId);
    setContratoId("");
    setValoresMensais({});
    setCopiado(false);
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

  const semTipos = !carregandoTipos && tipos.length === 0;

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
            <Rotulo htmlFor="gerar-tipo">Tipo de PRD</Rotulo>
            <Selecao
              id="gerar-tipo"
              value={tipoId}
              onChange={(e) => handleTrocarTipo(e.target.value)}
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
            <Rotulo htmlFor="gerar-contrato">Contrato</Rotulo>
            <Selecao
              id="gerar-contrato"
              value={contratoId}
              onChange={(e) => {
                setContratoId(e.target.value);
                setCopiado(false);
              }}
              disabled={!tipoSelecionado || carregandoContratos}
            >
              <option value="">
                {!tipoSelecionado
                  ? "Escolha o tipo primeiro"
                  : carregandoContratos
                    ? "Carregando..."
                    : contratosDoTipo.length === 0
                      ? "Nenhum contrato deste tipo"
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
            Nenhum tipo cadastrado ainda. Crie um em <strong>Cadastros → Tipos de PRD</strong>.
          </p>
        )}

        {tipoSelecionado && contratosDoTipo.length === 0 && !carregandoContratos && (
          <p className="mt-4 text-sm text-gray-500">
            Este tipo ainda não tem contratos. Cadastre um em <strong>Cadastros → Contratos</strong>.
          </p>
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

      {resultado !== null && (
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
