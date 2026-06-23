"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", label: "Abreviador" },
  { href: "/modelos", label: "Modelos de PRD" },
  { href: "/cadastros", label: "Cadastros" },
] as const;

function abaAtiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function IconeEngrenagem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const configAtivo = pathname === "/configuracoes";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between pt-3">
          <Link href="/" className="text-sm font-semibold text-gray-900">
            Abreviador de PRDs
          </Link>
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            aria-current={configAtivo ? "page" : undefined}
            title="Configurações"
            className={`rounded-md p-2 transition-colors ${
              configAtivo ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <IconeEngrenagem />
          </Link>
        </div>
        <nav aria-label="Navegação principal">
          <ul className="flex flex-wrap gap-1">
            {ABAS.map((aba) => {
              const ativo = abaAtiva(pathname, aba.href);
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
