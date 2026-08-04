"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ehAdminDoSetor } from "@/lib/setores";
import { useSessao } from "@/components/SessaoProvider";

// Cada sub-aba diz quem a enxerga. Contratos: qualquer admin/master. Categorias e Palavras são
// insumos de PRD (CPED). Usuários é só do master.
const SUBABAS = [
  { href: "/cadastros/contratos", label: "Contratos", visivel: () => true },
  { href: "/cadastros/tipos", label: "Categorias", visivel: (u: Perfil) => ehAdminDoSetor(u, "CPED") },
  {
    href: "/cadastros/palavras",
    label: "Palavras / Abreviações",
    visivel: (u: Perfil) => ehAdminDoSetor(u, "CPED"),
  },
  { href: "/cadastros/usuarios", label: "Usuários", visivel: (u: Perfil) => u.papel === "master" },
] as const;

type Perfil = { papel: "master" | "admin" | "usuario"; setores: string[] };

export default function LayoutCadastros({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, podeCadastros, carregando } = useSessao();

  // Área restrita a admin/master: usuário comum é mandado de volta para a Home.
  useEffect(() => {
    if (!carregando && !podeCadastros) router.replace("/");
  }, [carregando, podeCadastros, router]);

  if (carregando || !podeCadastros || !usuario) {
    return <p className="py-10 text-center text-sm text-gray-400">Carregando...</p>;
  }

  const subabas = SUBABAS.filter((aba) => aba.visivel(usuario));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Cadastros" className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {subabas.map((aba) => {
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
