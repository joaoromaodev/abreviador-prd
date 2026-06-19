"use client";

import { useEffect, useState } from "react";
import { aplicarAbreviacoes, verificarLimite } from "@/lib/abbreviation";
import { STORAGE_KEYS } from "@/lib/constants";
import { readStorage, removeStorage } from "@/lib/storage";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { usePalavras } from "@/hooks/usePalavras";
import { AreaTexto, Botao, Card, Rotulo } from "@/components/ui";

export default function PaginaAbreviador() {
  const { palavras, carregando: carregandoPalavras, erro: erroPalavras } = usePalavras();
  const { config, carregando: carregandoConfig, erro: erroConfig } = useConfiguracoes();

  const [textoEntrada, setTextoEntrada] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Carrega, uma única vez ao montar, um rascunho deixado pela aba "Modelos de PRDs"
  // (botão "Usar como modelo"). É uma leitura única de uma fonte externa no mount, não um
  // estado derivado de props/state — por isso o setState síncrono aqui é intencional.
  useEffect(() => {
    const rascunho = readStorage<string>(STORAGE_KEYS.rascunho, "");
    if (rascunho) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTextoEntrada(rascunho);
      removeStorage(STORAGE_KEYS.rascunho);
    }
  }, []);

  const carregando = carregandoPalavras || carregandoConfig;

  function handleAbreviar() {
    const textoProcessado = aplicarAbreviacoes(textoEntrada, palavras, {
      caseSensitive: config.caseSensitive,
      reaplicarAteEstabilizar: config.reaplicarAteEstabilizar,
    });
    setResultado(textoProcessado);
    setCopiado(false);
  }

  async function handleCopiar() {
    if (resultado === null) return;
    try {
      await navigator.clipboard.writeText(resultado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard API indisponível (ex.: contexto não seguro) — usuário pode selecionar o texto manualmente.
    }
  }

  const limiteInfo = resultado !== null ? verificarLimite(resultado, config.limiteCaracteres) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Abreviador</h1>
        <p className="mt-1 text-sm text-gray-500">
          Escreva o texto, clique em &quot;Abreviar&quot; e veja o resultado já com as abreviações cadastradas
          (compartilhadas com a equipe) aplicadas e o contador em relação ao limite de {config.limiteCaracteres}{" "}
          caracteres.
        </p>
      </div>

      {(erroPalavras || erroConfig) && (
        <p role="alert" className="text-sm text-red-600">
          {erroPalavras ?? erroConfig}
        </p>
      )}

      <Card>
        <Rotulo htmlFor="texto-entrada">Texto original</Rotulo>
        <AreaTexto
          id="texto-entrada"
          rows={10}
          value={textoEntrada}
          onChange={(e) => setTextoEntrada(e.target.value)}
          placeholder="Cole ou escreva aqui o texto do PRD..."
        />
        <div className="mt-1 text-xs text-gray-400">{textoEntrada.length} caracteres no texto original</div>

        <div className="mt-4">
          <Botao type="button" onClick={handleAbreviar} disabled={textoEntrada.trim().length === 0 || carregando}>
            {carregando ? "Carregando dicionário..." : "Abreviar"}
          </Botao>
        </div>
      </Card>

      {resultado !== null && limiteInfo && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Rotulo htmlFor="texto-resultado">Texto abreviado</Rotulo>
            <span
              role="status"
              className={`text-sm font-medium ${limiteInfo.cabe ? "text-green-700" : "text-red-700"}`}
            >
              {limiteInfo.tamanho} / {limiteInfo.limite} caracteres
            </span>
          </div>

          {!limiteInfo.cabe && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p className="font-semibold">O texto abreviado ainda excede o limite.</p>
              <p className="mt-1">
                Faltam <strong>{limiteInfo.excedente}</strong> caractere(s) para caber. O texto já compactado está
                abaixo — tente cortar ou reescrever algum trecho e abrevie novamente.
              </p>
            </div>
          )}

          <AreaTexto id="texto-resultado" rows={10} value={resultado} readOnly className="mt-3 bg-gray-50" />

          <div className="mt-4 flex items-center gap-3">
            <Botao type="button" variante="secundario" onClick={handleCopiar}>
              {copiado ? "Copiado!" : "Copiar texto"}
            </Botao>
          </div>
        </Card>
      )}
    </div>
  );
}
