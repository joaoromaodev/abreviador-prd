"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSessao } from "@/components/SessaoProvider";

const SUBABAS = [
  { href: "/cadastros/contratos", label: "Contratos" },
  { href: "/cadastros/tipos", label: "Tipos de PRD" },
  { href: "/cadastros/palavras", label: "Palavras / Abreviações" },
  { href: "/cadastros/usuarios", label: "Usuários" },
] as const;

export default function LayoutCadastros({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, carregando } = useSessao();

  // Área restrita a administradores: usuário comum é mandado de volta para a Home.
  useEffect(() => {
    if (!carregando && !isAdmin) router.replace("/");
  }, [carregando, isAdmin, router]);

  if (carregando || !isAdmin) {
    return <p className="py-10 text-center text-sm text-gray-400">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Cadastros" className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {SUBABAS.map((aba) => {
          const ativo = pathname === aba.href;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              aria-current={ativo ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                ativo ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
