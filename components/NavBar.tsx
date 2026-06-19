"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", label: "Abreviador" },
  { href: "/palavras", label: "Palavras / Abreviações" },
  { href: "/configuracoes", label: "Configurações" },
  { href: "/modelos", label: "Modelos de PRDs" },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4">
        <p className="pt-3 text-sm font-semibold text-gray-900">Abreviador de PRDs</p>
        <nav aria-label="Navegação principal">
          <ul className="flex flex-wrap gap-1">
            {ABAS.map((aba) => {
              const ativo = pathname === aba.href;
              return (
                <li key={aba.href}>
                  <Link
                    href={aba.href}
                    aria-current={ativo ? "page" : undefined}
                    className={`inline-block border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                      ativo
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                    }`}
                  >
                    {aba.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
