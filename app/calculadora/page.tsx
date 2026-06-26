"use client";

import { useMemo, useState } from "react";
import { calcularLocacao, derivarPeriodo } from "@/lib/calculo-locacao";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PaginaCalculadora() {
  const [valorMensal, setValorMensal] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [mesesCheios, setMesesCheios] = useState("");
  const [diasIncompletos, setDiasIncompletos] = useState("");
  const [avisoPeriodo, setAvisoPeriodo] = useState<string | null>(null);

  const mensal = Number(valorMensal.replace(",", "."));
  const dias = Number(diasIncompletos) || 0;
  const meses = Number(mesesCheios) || 0;

  const resultado = useMemo(() => {
    if (!Number.isFinite(mensal) || mensal <= 0) return null;
    return calcularLocacao(mensal, dias, meses);
  }, [mensal, dias, meses]);

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
          A partir do <strong>valor mensal</strong>, calcula os meses cheios e as diárias do mês incompleto, e mostra o{" "}
          <strong>total a pagar</strong> pra conferir com o processo. A diária é o valor mensal dividido por 30
          (sempre), arredondado pra baixo.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-5">
          <div className="max-w-xs">
            <Rotulo htmlFor="campo-mensal">Valor mensal (R$)</Rotulo>
            <CampoTexto
              id="campo-mensal"
              inputMode="decimal"
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
              placeholder="ex.: 15400,00"
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Do período (opcional)</p>
            <p className="mt-1 text-xs text-gray-500">
              Informe início e fim e preencha automaticamente. Mês que não começa no dia 1º ou não termina no último
              dia é contado como incompleto — confira e ajuste os campos abaixo se precisar.
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
                placeholder="ex.: 2"
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
                placeholder="ex.: 3"
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
                Valor da diária <span className="text-gray-400">(mensal ÷ 30, arredondado pra baixo)</span>
              </dt>
              <dd className="font-mono text-sm text-gray-900">{brl(resultado.valorDiaria)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm text-gray-600">
                Diárias do mês incompleto{" "}
                <span className="text-gray-400">
                  ({resultado.diasIncompletos} × {brl(resultado.valorDiaria)})
                </span>
              </dt>
              <dd className="font-mono text-sm text-gray-900">{brl(resultado.valorDiarias)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm text-gray-600">
                Meses cheios <span className="text-gray-400">({resultado.mesesCheios} × valor mensal)</span>
              </dt>
              <dd className="font-mono text-sm text-gray-900">{brl(resultado.valorMesesCheios)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
              <dt className="text-sm font-semibold text-blue-900">Total a pagar</dt>
              <dd className="font-mono text-base font-semibold text-blue-900">{brl(resultado.valorTotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-400">
            Confira se o total bate com o valor descrito no processo.
          </p>
        </Card>
      )}
    </div>
  );
}
