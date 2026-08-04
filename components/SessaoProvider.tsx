"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { podeAcessarSetor, podeAlgumCadastro, type Setor } from "@/lib/setores";

export interface UsuarioSessao {
  email: string;
  nome: string;
  papel: "master" | "admin" | "usuario";
  setores: string[];
}

interface ValorSessao {
  usuario: UsuarioSessao | null;
  /** Master: gerencia usuários/configurações e edita qualquer bloco. */
  isMaster: boolean;
  /** Tem acesso à área de Cadastros (master ou admin). */
  podeCadastros: boolean;
  carregando: boolean;
  /** True se o usuário atual pode acessar o setor (master sempre pode). False enquanto carrega. */
  podeSetor: (setor: Setor) => boolean;
}

const SessaoContext = createContext<ValorSessao>({
  usuario: null,
  isMaster: false,
  podeCadastros: false,
  carregando: true,
  podeSetor: () => false,
});

export function useSessao(): ValorSessao {
  return useContext(SessaoContext);
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let vivo = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { usuario: null }))
      .then((d) => {
        if (vivo) {
          setUsuario(d.usuario ?? null);
          setCarregando(false);
        }
      })
      .catch(() => {
        if (vivo) {
          setUsuario(null);
          setCarregando(false);
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Sessão ausente/inválida (ex.: cookie expirado que passou pelo gate otimista) → manda pro login.
  useEffect(() => {
    if (!carregando && !usuario && pathname !== "/login") {
      router.replace("/login");
    }
  }, [carregando, usuario, pathname, router]);

  const podeSetor = (setor: Setor): boolean =>
    Boolean(usuario) && podeAcessarSetor(usuario as UsuarioSessao, setor);

  return (
    <SessaoContext.Provider
      value={{
        usuario,
        isMaster: usuario?.papel === "master",
        podeCadastros: Boolean(usuario) && podeAlgumCadastro(usuario as UsuarioSessao),
        carregando,
        podeSetor,
      }}
    >
      {children}
    </SessaoContext.Provider>
  );
}
