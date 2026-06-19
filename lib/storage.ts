/**
 * Camada fina sobre localStorage. Isolar leitura/escrita aqui (em vez de espalhar
 * `window.localStorage` pelos componentes) é o que permite trocar a persistência por
 * chamadas de API no futuro sem tocar nas telas: basta reimplementar estas três funções.
 */

const isBrowser = typeof window !== "undefined";

export function readStorage<T>(key: string, valorPadrao: T): T {
  if (!isBrowser) return valorPadrao;
  try {
    const bruto = window.localStorage.getItem(key);
    if (!bruto) return valorPadrao;
    return JSON.parse(bruto) as T;
  } catch {
    return valorPadrao;
  }
}

export function writeStorage<T>(key: string, valor: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(valor));
  } catch {
    // localStorage indisponível (modo privado, quota excedida, etc.) — falha silenciosa.
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignora
  }
}
