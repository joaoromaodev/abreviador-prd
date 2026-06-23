import { redirect } from "next/navigation";

export default function PaginaCadastros() {
  // "Cadastros" não tem conteúdo próprio: cai direto na primeira sub-aba.
  redirect("/cadastros/contratos");
}
