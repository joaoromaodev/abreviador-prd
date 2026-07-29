"use client";

import { useMemo, useState } from "react";
import { CAMPOS_EMPENHO, temDadosEmpenho } from "@/lib/empenho";
import { formatarData, hojeISO } from "@/lib/vigencia";
import type { Contrato } from "@/lib/types";
import { useContratos } from "@/hooks/useContratos";
import { Botao, CampoTexto, Card } from "@/components/ui";
import { EtiquetaVigencia } from "@/components/EtiquetaVigencia";

/** Texto pesquisável de um contrato: nome + campos-chave do empenho. */
function textoBusca(contrato: Contrato): string {
  const e = contrato.dadosEmpenho ?? {};
  return [contrato.nome, e.credor, e.cnpj, e.numContrato, e.processo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function CampoCopiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Clipboard indisponível — o usuário pode selecionar manualmente.
    }
  }
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{rotulo}</p>
        <p className="mt-0.5 break-words text-sm text-gray-900">{valor}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        aria-label={`Copiar ${rotulo}`}
      >
        {copiado ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

export default function PaginaEmpenho() {
  const { contratos, carregando, erro } = useContratos();
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [copiadoTudo, setCopiadoTudo] = useState(false);

  const hoje = useMemo(() => hojeISO(), []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contratos;
    return contratos.filter((c) => textoBusca(c).includes(termo));
  }, [contratos, busca]);

  const selecionado = useMemo(
    () => contratos.find((c) => c.id === selecionadoId) ?? null,
    [contratos, selecionadoId]
  );

  // Campos do schema com valor preenchido neste contrato.
  const camposPreenchidos = useMemo(() => {
    if (!selecionado) return [];
    const e = selecionado.dadosEmpenho ?? {};
    return CAMPOS_EMPENHO.filter((c) => (e[c.chave] ?? "").trim() !== "").map((c) => ({
      rotulo: c.rotulo,
      valor: e[c.chave].trim(),
    }));
  }, [selecionado]);

  async function copiarTudo() {
    if (camposPreenchidos.length === 0) return;
    const texto = camposPreenchidos.map((c) => `${c.rotulo}: ${c.valor}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoTudo(true);
      setTimeout(() => setCopiadoTudo(false), 1500);
    } catch {
      // Clipboard indisponível.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Consulta para Empenho</h1>
        <p className="mt-1 text-sm text-gray-500">
          Encontre o contrato e copie os dados prontos para lançar a nota de empenho no SIAFE. Somente leitura —
          o cadastro é feito em <strong>Cadastros → Contratos</strong>.
        </p>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        {/* Lista de contratos */}
        <div className="flex flex-col gap-3">
          <CampoTexto
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, credor, CNPJ, nº do contrato ou processo..."
            aria-label="Buscar contrato"
          />
          <div className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto">
            {carregando ? (
              <p className="py-6 text-center text-sm text-gray-400">Carregando...</p>
            ) : filtrados.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                {contratos.length === 0 ? "Nenhum contrato cadastrado." : "Nenhum contrato encontrado."}
              </p>
            ) : (
              filtrados.map((c) => {
                const ativo = c.id === selecionadoId;
                const temEmpenho = temDadosEmpenho(c.dadosEmpenho);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelecionadoId(c.id)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      ativo
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block truncate font-medium">{c.nome}</span>
                    {!temEmpenho && (
                      <span className="mt-0.5 block text-xs text-amber-600">Sem dados de empenho preenchidos</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detalhe do contrato selecionado */}
        <div>
          {!selecionado ? (
            <Card>
              <p className="text-sm text-gray-500">Selecione um contrato na lista para ver os dados de empenho.</p>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-gray-900">{selecionado.nome}</h2>
                    <EtiquetaVigencia
                      vigenciaFim={selecionado.vigenciaFim}
                      hoje={hoje}
                      indeterminada={selecionado.vigenciaIndeterminada}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Vigência:{" "}
                    {selecionado.vigenciaIndeterminada
                      ? "prazo indeterminado"
                      : `${formatarData(selecionado.vigenciaInicio) || "—"} a ${
                          formatarData(selecionado.vigenciaFim) || "—"
                        }`}
                  </p>
                </div>
                {camposPreenchidos.length > 0 && (
                  <Botao type="button" variante="secundario" onClick={copiarTudo}>
                    {copiadoTudo ? "Copiado!" : "Copiar tudo"}
                  </Botao>
                )}
              </div>

              <div className="mt-4">
                {camposPreenchidos.length === 0 ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Este contrato ainda não tem dados de empenho preenchidos. Um administrador pode preenchê-los em
                    Cadastros → Contratos.
                  </p>
                ) : (
                  camposPreenchidos.map((c) => <CampoCopiavel key={c.rotulo} rotulo={c.rotulo} valor={c.valor} />)
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
