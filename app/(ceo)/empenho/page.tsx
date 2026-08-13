"use client";

import { useMemo, useState } from "react";
import { SECOES_EMPENHO, temDadosEmpenho } from "@/lib/empenho";
import { formatarData, hojeISO } from "@/lib/vigencia";
import type { Contrato } from "@/lib/types";
import { useContratos } from "@/hooks/useContratos";
import { Botao, CampoTexto, Card } from "@/components/ui";
import { EtiquetaVigencia } from "@/components/EtiquetaVigencia";

/** Campo preenchido pronto para copiar. */
interface CampoValor {
  rotulo: string;
  valor: string;
}

/** Grupo (subseção) de uma etapa com só os campos preenchidos. */
interface GrupoPreenchido {
  titulo?: string;
  campos: CampoValor[];
}

/** Etapa do SIAFE com só o que este contrato tem preenchido. */
interface SecaoPreenchida {
  numero: number;
  id: string;
  titulo: string;
  grupos: GrupoPreenchido[];
  total: number;
}

/** Texto pesquisável de um contrato: nome + campos-chave do empenho. */
function textoBusca(contrato: Contrato): string {
  const e = contrato.dadosEmpenho ?? {};
  return [contrato.nome, e.credor, e.cnpj, e.numContrato, e.processo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Monta, para um contrato, as 3 etapas com apenas os campos preenchidos. */
function montarSecoes(contrato: Contrato): SecaoPreenchida[] {
  const e = contrato.dadosEmpenho ?? {};
  return SECOES_EMPENHO.map((secao) => {
    const grupos: GrupoPreenchido[] = secao.grupos
      .map((grupo) => ({
        titulo: grupo.titulo,
        campos: grupo.campos
          .filter((c) => (e[c.chave] ?? "").trim() !== "")
          .map((c) => ({ rotulo: c.rotulo, valor: e[c.chave].trim() })),
      }))
      .filter((g) => g.campos.length > 0);
    const total = grupos.reduce((n, g) => n + g.campos.length, 0);
    return { numero: secao.numero, id: secao.id, titulo: secao.titulo, grupos, total };
  });
}

/** Texto "Rótulo: valor" de uma etapa, para o botão Copiar da seção / de tudo. */
function textoSecao(secao: SecaoPreenchida): string {
  return secao.grupos
    .flatMap((g) => g.campos.map((c) => `${c.rotulo}: ${c.valor}`))
    .join("\n");
}

function useCopia(): [boolean, (texto: string) => void] {
  const [copiado, setCopiado] = useState(false);
  function copiar(texto: string) {
    navigator.clipboard.writeText(texto).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      },
      () => {
        // Clipboard indisponível — o usuário pode selecionar manualmente.
      }
    );
  }
  return [copiado, copiar];
}

function CampoCopiavel({ rotulo, valor }: CampoValor) {
  const [copiado, copiar] = useCopia();
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{rotulo}</p>
        <p className="mt-0.5 break-words text-sm text-gray-900">{valor}</p>
      </div>
      <button
        type="button"
        onClick={() => copiar(valor)}
        className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        aria-label={`Copiar ${rotulo}`}
      >
        {copiado ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

/** Uma etapa do SIAFE como accordion: abre e mostra os campos preenchidos. */
function SecaoAccordion({
  secao,
  aberta,
  onToggle,
}: {
  secao: SecaoPreenchida;
  aberta: boolean;
  onToggle: () => void;
}) {
  const [copiado, copiar] = useCopia();
  const vazia = secao.total === 0;
  const painelId = `secao-${secao.id}`;
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <div className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberta}
          aria-controls={painelId}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={`text-gray-400 transition-transform ${aberta ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="truncate text-sm font-medium text-gray-800">
            Etapa {secao.numero} · {secao.titulo}
          </span>
          <span className="shrink-0 text-xs text-gray-400">
            {vazia ? "sem dados" : `${secao.total} ${secao.total === 1 ? "campo" : "campos"}`}
          </span>
        </button>
        {!vazia && (
          <button
            type="button"
            onClick={() => copiar(textoSecao(secao))}
            className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            {copiado ? "Copiado!" : "Copiar seção"}
          </button>
        )}
      </div>
      {aberta && (
        <div id={painelId} className="px-3 py-2">
          {vazia ? (
            <p className="py-2 text-xs text-gray-400">Nenhum dado preenchido nesta etapa.</p>
          ) : (
            secao.grupos.map((grupo, gi) => (
              <div key={grupo.titulo ?? gi} className={gi > 0 ? "mt-3" : ""}>
                {grupo.titulo && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {grupo.titulo}
                  </p>
                )}
                {grupo.campos.map((c) => (
                  <CampoCopiavel key={c.rotulo} rotulo={c.rotulo} valor={c.valor} />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PaginaEmpenho() {
  const { contratos, carregando, erro } = useContratos();
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [fechadas, setFechadas] = useState<Set<string>>(new Set());
  const [copiadoTudo, copiarTudo] = useCopia();

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

  const secoes = useMemo(() => (selecionado ? montarSecoes(selecionado) : []), [selecionado]);
  const totalPreenchido = useMemo(() => secoes.reduce((n, s) => n + s.total, 0), [secoes]);

  function toggleSecao(id: string) {
    setFechadas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function handleCopiarTudo() {
    const texto = secoes
      .filter((s) => s.total > 0)
      .map((s) => `=== Etapa ${s.numero} · ${s.titulo} ===\n${textoSecao(s)}`)
      .join("\n\n");
    if (texto) copiarTudo(texto);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Consulta para Empenho</h1>
        <p className="mt-1 text-sm text-gray-500">
          Encontre o contrato e copie os dados prontos para lançar a nota de empenho no SIAFE. As três etapas abaixo
          seguem o passo a passo do sistema. Somente leitura — o cadastro é feito em{" "}
          <strong>Cadastros → Contratos</strong>.
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
                {totalPreenchido > 0 && (
                  <Botao type="button" variante="secundario" onClick={handleCopiarTudo}>
                    {copiadoTudo ? "Copiado!" : "Copiar tudo"}
                  </Botao>
                )}
              </div>

              <div className="mt-4">
                {totalPreenchido === 0 ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Este contrato ainda não tem dados de empenho preenchidos. Um administrador pode preenchê-los em
                    Cadastros → Contratos.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {secoes.map((secao) => (
                      <SecaoAccordion
                        key={secao.id}
                        secao={secao}
                        aberta={!fechadas.has(secao.id)}
                        onToggle={() => toggleSecao(secao.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
