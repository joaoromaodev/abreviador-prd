"use client";

import { useMemo, useState } from "react";
import { calcularLocacao, derivarPeriodo } from "@/lib/calculo-locacao";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PaginaCalculadora() {
  const [valorTotal, setValorTotal] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [mesesCheios, setMesesCheios] = useState("");
  const [diasIncompletos, setDiasIncompletos] = useState("");
  const [avisoPeriodo, setAvisoPeriodo] = useState<string | null>(null);

  const total = Number(valorTotal.replace(",", "."));
  const dias = Number(diasIncompletos) || 0;
  const meses = Number(mesesCheios) || 0;

  const resultado = useMemo(() => {
    if (!Number.isFinite(total) || total <= 0) return null;
    return calcularLocacao(total, dias, meses);
  }, [total, dias, meses]);

  function preencherDoPeriodo() {
    const derivado = derivarPeriodo(inicio, fim);
    if (!derivado) {
      setAvisoPeriodo("Informe um início e um fim válidos (o fim não pode ser antes do início).");
      return;
    }
    setAvisoPeriodo(null);
    setMesesCheios(String(derivado.mesesCheios));
    setDiasIncompletos(String(derivado.diasIncompletos));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Calculadora de Locação</h1>
        <p className="mt-1 text-sm text-gray-500">
          Separa o valor total entre os <strong>meses cheios</strong> e as <strong>diárias</strong> do mês incompleto.
          A diária é o total dividido por 30 (sempre), arredondado pra baixo.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-5">
          <div className="max-w-xs">
            <Rotulo htmlFor="campo-total">Valor total a pagar (R$)</Rotulo>
            <CampoTexto
              id="campo-total"
              inputMode="decimal"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="ex.: 3500,00"
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Do período (opcional)</p>
            <p className="mt-1 text-xs text-gray-500">
              Informe início e fim e preencha automaticamente. Assume início no dia 1º — confira e ajuste os campos
              abaixo se precisar.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <Rotulo htmlFor="campo-inicio">Início</Rotulo>
                <CampoTexto id="campo-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div>
                <Rotulo htmlFor="campo-fim">Fim</Rotulo>
                <CampoTexto id="campo-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
              <Botao type="button" variante="secundario" onClick={preencherDoPeriodo}>
                Preencher meses e dias
              </Botao>
            </div>
            {avisoPeriodo && <p className="mt-2 text-sm text-red-600">{avisoPeriodo}</p>}
          </div>

          <div className="grid max-w-md gap-4 sm:grid-cols-2">
            <div>
              <Rotulo htmlFor="campo-meses">Meses cheios</Rotulo>
              <CampoTexto
                id="campo-meses"
                type="number"
                min={0}
                value={mesesCheios}
                onChange={(e) => setMesesCheios(e.target.value)}
                placeholder="ex.: 1"
              />
            </div>
            <div>
              <Rotulo htmlFor="campo-dias">Dias do mês incompleto</Rotulo>
              <CampoTexto
                id="campo-dias"
                type="number"
                min={0}
                max={31}
                value={diasIncompletos}
                onChange={(e) => setDiasIncompletos(e.target.value)}
                placeholder="ex.: 17"
              />
            </div>
          </div>
        </div>
      </Card>

      {resultado && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700">Resultado</h2>
          <dl className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm text-gray-600">
                Valor da diária <span className="text-gray-400">(total ÷ 30, arredondado pra baixo)</span>
              </dt>
              <dd className="font-mono text-sm text-gray-900">{brl(resultado.valorDiaria)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm text-gray-600">
                Diárias do mês incompleto <span className="text-gray-400">({resultado.diasIncompletos} dia(s))</span>
              </dt>
              <dd className="font-mono text-sm text-gray-900">{brl(resultado.valorDiarias)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-gray-800">
                Valor dos meses cheios{" "}
                <span className="font-normal text-gray-400">({resultado.mesesCheios} mês(es))</span>
              </dt>
              <dd className="font-mono text-base font-semibold text-gray-900">{brl(resultado.valorMesesCheios)}</dd>
            </div>
            {resultado.mesesCheios > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <dt>Por mês cheio</dt>
                <dd className="font-mono">{brl(resultado.valorMesesCheios / resultado.mesesCheios)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs text-gray-400">
            Soma das partes: {brl(resultado.valorDiarias + resultado.valorMesesCheios)} (deve bater com o total).
          </p>
        </Card>
      )}
    </div>
  );
}
