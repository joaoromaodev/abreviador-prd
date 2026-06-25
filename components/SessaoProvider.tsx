"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface UsuarioSessao {
  email: string;
  nome: string;
  papel: "admin" | "usuario";
}

interface ValorSessao {
  usuario: UsuarioSessao | null;
  isAdmin: boolean;
  carregando: boolean;
}

const SessaoContext = createContext<ValorSessao>({ usuario: null, isAdmin: false, carregando: true });

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

  return (
    <SessaoContext.Provider value={{ usuario, isAdmin: usuario?.papel === "admin", carregando }}>
      {children}
    </SessaoContext.Provider>
  );
}
