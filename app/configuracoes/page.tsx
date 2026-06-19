"use client";

import { useState } from "react";
import { CONFIG_PADRAO, LIMITE_CARACTERES_MAX, LIMITE_CARACTERES_MIN } from "@/lib/constants";
import type { Configuracoes } from "@/lib/types";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { Botao, CampoTexto, Card, Rotulo } from "@/components/ui";

export default function PaginaConfiguracoes() {
  const { config, carregando, erro: erroCarregamento, salvar } = useConfiguracoes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Ajustes do abreviador, compartilhados com toda a equipe.</p>
      </div>

      {erroCarregamento && (
        <p role="alert" className="text-sm text-red-600">
          {erroCarregamento}
        </p>
      )}

      <Card>
        {carregando ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : (
          // `key` força remontar o formulário (com o lazy useState abaixo) assim que os dados
          // chegam do servidor, sem precisar de um useEffect pra sincronizar estado remoto -> local.
          <FormularioConfiguracoes key="carregado" configInicial={config} onSalvar={salvar} />
        )}
      </Card>
    </div>
  );
}

function FormularioConfiguracoes({
  configInicial,
  onSalvar,
}: {
  configInicial: Configuracoes;
  onSalvar: (config: Configuracoes) => Promise<Configuracoes>;
}) {
  const [form, setForm] = useState(configInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvoRecentemente, setSalvoRecentemente] = useState(false);

  async function persistir(novoForm: Configuracoes) {
    setSalvando(true);
    setErro(null);
    try {
      const salvo = await onSalvar(novoForm);
      setForm(salvo);
      setSalvoRecentemente(true);
      setTimeout(() => setSalvoRecentemente(false), 1500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function handleLimiteChange(valorTexto: string) {
    const numero = Number(valorTexto);
    if (!Number.isFinite(numero)) return;
    const limitado = Math.min(LIMITE_CARACTERES_MAX, Math.max(LIMITE_CARACTERES_MIN, Math.floor(numero)));
    setForm((atual) => ({ ...atual, limiteCaracteres: limitado }));
  }

  function handleCheckboxChange(campo: "caseSensitive" | "reaplicarAteEstabilizar", valor: boolean) {
    const novoForm = { ...form, [campo]: valor };
    setForm(novoForm);
    void persistir(novoForm);
  }

  function handleRestaurarPadrao() {
    setForm(CONFIG_PADRAO);
    void persistir(CONFIG_PADRAO);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xs">
        <Rotulo htmlFor="campo-limite">Limite de caracteres</Rotulo>
        <div className="flex gap-2">
          <CampoTexto
            id="campo-limite"
            type="number"
            min={LIMITE_CARACTERES_MIN}
            max={LIMITE_CARACTERES_MAX}
            value={form.limiteCaracteres}
            onChange={(e) => handleLimiteChange(e.target.value)}
          />
          <Botao type="button" onClick={() => persistir(form)} disabled={salvando}>
            Salvar
          </Botao>
        </div>
        <p className="mt-1 text-xs text-gray-400">Padrão: {CONFIG_PADRAO.limiteCaracteres} caracteres.</p>
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.caseSensitive}
          onChange={(e) => handleCheckboxChange("caseSensitive", e.target.checked)}
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
          checked={form.reaplicarAteEstabilizar}
          onChange={(e) => handleCheckboxChange("reaplicarAteEstabilizar", e.target.checked)}
        />
        <span>
          <span className="font-medium">Reaplicar abreviações até estabilizar</span>
          <br />
          <span className="text-gray-500">
            Repete a substituição até nenhuma abreviação cadastrada mudar mais o texto — útil quando a abreviação de
            uma palavra coincide com outra palavra cadastrada.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Botao type="button" variante="secundario" onClick={handleRestaurarPadrao} disabled={salvando}>
          Restaurar padrão
        </Botao>
        <span
          role="status"
          className={`text-sm text-green-700 transition-opacity ${salvoRecentemente ? "opacity-100" : "opacity-0"}`}
        >
          Salvo.
        </span>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
