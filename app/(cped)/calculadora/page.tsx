"use client";

import { useMemo, useState } from "react";
import { calcularLocacao, derivarPeriodo } from "@/lib/calculo-locacao";
import { CampoTexto, Card, Rotulo } from "@/components/ui";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PaginaCalculadora() {
  const [valorMensal, setValorMensal] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [ajusteManual, setAjusteManual] = useState(false);
  const [mesesManual, setMesesManual] = useState("");
  const [diasManual, setDiasManual] = useState("");

  const mensal = Number(valorMensal.replace(",", "."));
  const derivado = useMemo(() => derivarPeriodo(inicio, fim), [inicio, fim]);
  const periodoPreenchido = inicio !== "" && fim !== "";

  const mesesCheios = ajusteManual ? Number(mesesManual) || 0 : (derivado?.mesesCheios ?? 0);
  const diasIncompletos = ajusteManual ? Number(diasManual) || 0 : (derivado?.diasIncompletos ?? 0);

  const resultado = useMemo(() => {
    if (!Number.isFinite(mensal) || mensal <= 0) return null;
    if (!ajusteManual && !derivado) return null;
    return calcularLocacao(mensal, diasIncompletos, mesesCheios);
  }, [mensal, ajusteManual, derivado, diasIncompletos, mesesCheios]);

  function alternarManual(marcado: boolean) {
    // Ao ligar o ajuste manual, parte dos valores já derivados do período.
    if (marcado && derivado) {
      setMesesManual(String(derivado.mesesCheios));
      setDiasManual(String(derivado.diasIncompletos));
    }
    setAjusteManual(marcado);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Calculadora de Locação</h1>
        <p className="mt-1 text-sm text-gray-500">
          Informe o <strong>valor mensal</strong> e o <strong>período</strong>: a calculadora separa os meses cheios
          das diárias do mês incompleto e mostra o <strong>total a pagar</strong> pra conferir com o processo.
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

          <div className="flex flex-wrap gap-4">
            <div>
              <Rotulo htmlFor="campo-inicio">Início do período</Rotulo>
              <CampoTexto id="campo-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <Rotulo htmlFor="campo-fim">Fim do período</Rotulo>
              <CampoTexto id="campo-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>

          {periodoPreenchido && !derivado && (
            <p className="text-sm text-red-600">O fim do período não pode ser antes do início.</p>
          )}
          {derivado && !ajusteManual && (
            <p className="text-sm text-gray-600">
              Período: <strong>{derivado.mesesCheios}</strong> mês(es) cheio(s) +{" "}
              <strong>{derivado.diasIncompletos}</strong> dia(s) do mês incompleto.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={ajusteManual}
              onChange={(e) => alternarManual(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Ajustar meses e dias manualmente (casos fora do padrão)
          </label>

          {ajusteManual && (
            <div className="grid max-w-md gap-4 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="campo-meses">Meses cheios</Rotulo>
                <CampoTexto
                  id="campo-meses"
                  type="number"
                  min={0}
                  value={mesesManual}
                  onChange={(e) => setMesesManual(e.target.value)}
                />
              </div>
              <div>
                <Rotulo htmlFor="campo-dias">Dias do mês incompleto</Rotulo>
                <CampoTexto
                  id="campo-dias"
                  type="number"
                  min={0}
                  max={31}
                  value={diasManual}
                  onChange={(e) => setDiasManual(e.target.value)}
                />
              </div>
            </div>
          )}
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
          <p className="mt-3 text-xs text-gray-400">Confira se o total bate com o valor descrito no processo.</p>
        </Card>
      )}
    </div>
  );
}
