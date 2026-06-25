import type { Metadata } from "next";
import "./globals.css";
import { ChromeApp } from "@/components/ChromeApp";
import { SessaoProvider } from "@/components/SessaoProvider";

export const metadata: Metadata = {
  title: "Abreviador de PRDs",
  description:
    "Abrevie textos automaticamente para caber em um limite de caracteres, com dicionário de abreviações configurável.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900 antialiased">
        <SessaoProvider>
          <ChromeApp>{children}</ChromeApp>
        </SessaoProvider>
      </body>
    </html>
  );
}
