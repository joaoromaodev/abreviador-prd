import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Abreviador de PRDs",
  description:
    "Abrevie textos automaticamente para caber em um limite de caracteres, com dicionário de abreviações configurável.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900 antialiased">
        <NavBar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          Os dados (palavras, tipos, contratos e configurações) são compartilhados pela equipe via Google Sheets.
        </footer>
      </body>
    </html>
  );
}
