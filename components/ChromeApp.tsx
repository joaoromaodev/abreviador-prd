"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

/** Casca do app (navegação + rodapé). A tela de /login é renderizada sozinha, sem essa casca. */
export function ChromeApp({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Os dados (palavras, tipos, contratos e configurações) são compartilhados pela equipe via Google Sheets.
      </footer>
    </>
  );
}
