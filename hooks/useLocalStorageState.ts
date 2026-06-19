"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

type Atualizador<T> = T | ((atual: T) => T);
type Ouvinte = () => void;

/**
 * Mini-store externo por chave: guarda o valor já parseado em memória e notifica todos os
 * componentes inscritos na mesma chave quando ela muda — inclusive entre páginas diferentes
 * que leem a mesma chave (ex.: a lista de palavras é usada tanto no Abreviador quanto na
 * aba Palavras/Abreviações).
 */
const ouvintesPorChave = new Map<string, Set<Ouvinte>>();
const cachePorChave = new Map<string, unknown>();

function obterOuvintes(key: string): Set<Ouvinte> {
  let conjunto = ouvintesPorChave.get(key);
  if (!conjunto) {
    conjunto = new Set();
    ouvintesPorChave.set(key, conjunto);
  }
  return conjunto;
}

/**
 * Estado React persistido em localStorage, sincronizado via `useSyncExternalStore`.
 *
 * Isso evita o problema clássico de SSR + localStorage (o servidor não tem acesso ao
 * localStorage do usuário): no servidor, e na primeira renderização do client durante a
 * hidratação, o valor é sempre `valorPadrao`; o React troca para o valor real assim que a
 * hidratação termina, sem warning de mismatch e sem precisar de um `useEffect` manual.
 */
export function useLocalStorageState<T>(key: string, valorPadrao: T) {
  const subscribe = useCallback((ouvinte: Ouvinte) => {
    const conjunto = obterOuvintes(key);
    conjunto.add(ouvinte);
    return () => conjunto.delete(ouvinte);
  }, [key]);

  const getSnapshot = useCallback((): T => {
    if (!cachePorChave.has(key)) {
      cachePorChave.set(key, readStorage<T>(key, valorPadrao));
    }
    return cachePorChave.get(key) as T;
    // valorPadrao só importa na 1ª leitura da chave; manter fora das deps evita recriar a
    // função (e invalidar o cache do useSyncExternalStore) quando o chamador passa um literal novo a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const getServerSnapshot = useCallback((): T => valorPadrao, [valorPadrao]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (atualizador: Atualizador<T>) => {
      const atual = cachePorChave.has(key) ? (cachePorChave.get(key) as T) : readStorage<T>(key, valorPadrao);
      const novo = typeof atualizador === "function" ? (atualizador as (a: T) => T)(atual) : atualizador;
      cachePorChave.set(key, novo);
      writeStorage(key, novo);
      obterOuvintes(key).forEach((ouvinte) => ouvinte());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return { value, setValue, hidratado: true } as const;
}
