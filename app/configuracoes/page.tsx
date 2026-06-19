"use client";

import { useState } from "react";
import { CONFIG_PADRAO, LIMITE_CARACTERES_MAX, LIMITE_CARACTERES_MIN, STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaConfiguracoes() {
  const { value: config, setValue: setConfig, hidratado } = useLocalStorageState(
    STORAGE_KEYS.configuracoes,
    CONFIG_PADRAO
  );
  const [salvoRecentemente, setSalvoRecentemente] = useState(false);

  function avisarSalvo() {
    setSalvoRecentemente(true);
    setTimeout(() => setSalvoRecentemente(false), 1500);
  }

  function handleLimiteChange(valorTexto: string) {
    const numero = Number(valorTexto);
    if (!Number.isFinite(numero)) return;
    const limitado = Math.min(LIMITE_CARACTERES_MAX, Math.max(LIMITE_CARACTERES_MIN, Math.floor(numero)));
    setConfig((atual) => ({ ...atual, limiteCaracteres: limitado }));
    avisarSalvo();
  }

  function handleRestaurarPadrao() {
    setConfig(CONFIG_PADRAO);
    avisarSalvo();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Ajustes do abreviador. As alterações são salvas automaticamente.</p>
      </div>

      <Card>
        {!hidratado ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="max-w-xs">
              <Rotulo htmlFor="campo-limite">Limite de caracteres</Rotulo>
              <CampoTexto
                id="campo-limite"
                type="number"
                min={LIMITE_CARACTERES_MIN}
                max={LIMITE_CARACTERES_MAX}
                value={config.limiteCaracteres}
                onChange={(e) => handleLimiteChange(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">Padrão: {CONFIG_PADRAO.limiteCaracteres} caracteres.</p>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={config.caseSensitive}
                onChange={(e) => {
                  setConfig((atual) => ({ ...atual, caseSensitive: e.target.checked }));
                  avisarSalvo();
                }}
              />
              <span>
                <span className="font-medium">Diferenciar maiúsculas/minúsculas</span>
                <br />
                <span className="text-gray-500">
                  Quando ligado, só abrevia se a palavra no texto estiver escrita exatamente como cadastrada.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={config.reaplicarAteEstabilizar}
                onChange={(e) => {
                  setConfig((atual) => ({ ...atual, reaplicarAteEstabilizar: e.target.checked }));
                  avisarSalvo();
                }}
              />
              <span>
                <span className="font-medium">Reaplicar abreviações até estabilizar</span>
                <br />
                <span className="text-gray-500">
                  Repete a substituição até nenhuma abreviação cadastrada mudar mais o texto — útil quando a
                  abreviação de uma palavra coincide com outra palavra cadastrada.
                </span>
              </span>
            </label>

            <div className="flex items-center gap-3">
              <Botao type="button" variante="secundario" onClick={handleRestaurarPadrao}>
                Restaurar padrão
              </Botao>
              <span role="status" className={`text-sm text-green-700 transition-opacity ${salvoRecentemente ? "opacity-100" : "opacity-0"}`}>
                Salvo.
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
