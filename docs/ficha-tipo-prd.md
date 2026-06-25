# Ficha do Tipo de PRD

Documento para a equipe **definir as regras de cada novo tipo de PRD** (Prestação de Serviço,
Aquisições, etc.) de forma estruturada e sem ambiguidade. Para cada tipo novo, **copie a seção
"Ficha em branco"** abaixo, preencha e me envie. A ficha de **Locação de Imóveis** (já no ar) está
no final como exemplo de referência.

## Como funcionam os marcadores

No "texto padrão", marque cada pedaço variável com um destes:

| Marcador | Significado | Onde é preenchido |
|---|---|---|
| `<<campo>>` | muda **todo mês** | digitado na hora, na aba **Modelos de PRD** |
| `{campo}` | **fixo do contrato** | cadastrado uma vez, na aba **Cadastros → Contratos** |

## Como escrever as regras condicionais

Sempre no formato **SE → ENTÃO**, descrevendo a condição do contrato e o que muda no texto:

> SE [condição] ENTÃO [o que acontece com o texto]

Exemplo: `SE o contrato não tem termo aditivo ENTÃO remove "<<termo>>" e usa só {textocontrato}.`

Esse formato evita o mal-entendido clássico de "usa o campo X" (um ou os dois?). Deixe explícito.

## Dica que economiza tempo

Junto da ficha, mande **2 ou 3 PRDs reais já prontos** (o texto final), com os dados que geraram
cada um. Com exemplos reais eu monto o template de trás pra frente e ainda crio testes automáticos
que pegam casos de borda que ninguém lembrou de descrever.

---

## Ficha em branco (copie a partir daqui)

```
1. NOME DO TIPO:
   (ex.: Prestação de Serviço)

2. TEXTO PADRÃO (com os marcadores <<>> e {}):
   "..."

3. CAMPOS MENSAIS  <<campo>>  (mudam todo mês):
   <<____>>  → rótulo "____________"  | exemplo: ____
   <<____>>  → rótulo "____________"  | exemplo: ____

4. CAMPOS DO CONTRATO  {campo}  (fixos, cadastrados uma vez):
   {____}  → rótulo "____________"  | linha curta / texto longo | exemplo: ____
   {____}  → rótulo "____________"  | linha curta / texto longo | exemplo: ____

5. REGRAS CONDICIONAIS (formato SE → ENTÃO):
   SE ____________________  ENTÃO  ____________________
   SE ____________________  ENTÃO  ____________________

6. FORMATOS ESPECIAIS / OBSERVAÇÕES:
   (ex.: datas em texto livre; algum campo derivado de outro; etc.)

7. EXEMPLOS REAIS (2 ou 3 PRDs já prontos + os dados que geraram cada um):
   Exemplo 1: "..."
   Exemplo 2: "..."
```

---

## Exemplo de referência — Locação de Imóveis (já no ar)

```
1. NOME DO TIPO:
   Locação de Imóveis

2. TEXTO PADRÃO:
   "ESFERA:1-ORCAMENTO FISCAL UGR:160101, PLANO INTERNO:<<pi>>, ACAO:<<açao>>,
   FUNCIONAL PROGRAMATICA:<<programatica>>, PROJETO ATIVIDADE:<<projatv>>, PRODUTO:<<produto>>,
   NATUREZA DE DESPESA: {natdesp}, FONTE:<<fonte>>; PAGAMENTO REFERENTE AO CONTRATO Nº {contrato}
   <<termo>>; {modalidade}; PAGAMENTO REFERENTE AO PERIODO DE <<periodo>>;
   {textotermoadtivo}; OBJETO DO CONTRATO: {objdocontrato}."

3. CAMPOS MENSAIS  <<campo>>:
   <<pi>>           → "Plano Interno"           | exemplo: 1234
   <<açao>>         → "Ação"                     | exemplo: 5678
   <<programatica>> → "Funcional Programática"   | exemplo: 04.122.0001
   <<projatv>>      → "Projeto Atividade"        | exemplo: 2001
   <<produto>>      → "Produto"                  | exemplo: PROD-X
   <<fonte>>        → "Fonte"                    | exemplo: 100
   <<periodo>>      → "Período"                  | exemplo: 01/06 a 30/06

4. CAMPOS DO CONTRATO  {campo}:
   {natdesp}          → "Natureza de Despesa"     | linha curta | ex.: 33903600
   {contrato}         → "Nº do Contrato"          | linha curta | ex.: 123/2020
   {modalidade}       → "Modalidade"              | linha curta | ex.: DISPENSA DE LICITACAO
   {textotermoadtivo} → "Texto do Termo Aditivo"  | texto longo | ex.: 8 TERMO ADITIVO
   {objdocontrato}    → "Objeto do Contrato"      | texto longo | ex.: LOCACAO DE IMOVEL PARA A SEDE

5. REGRAS CONDICIONAIS:
   SE o contrato NÃO tem termo aditivo
      ENTÃO remove o "<<termo>>" (vira "Nº {contrato};")
      E o segmento "{textotermoadtivo}" some por completo (sem deixar ";" órfão).

   SE o contrato TEM termo aditivo
      ENTÃO "<<termo>>" vira "(Nº T.A)" — ex.: "(8º T.A)", com o número vindo do cadastro
      do contrato — E o segmento "{textotermoadtivo}" é preenchido com o texto do termo aditivo.

6. FORMATOS ESPECIAIS / OBSERVAÇÕES:
   - Período é texto livre: aceita DD/MM/YYYY ou DD/MMMM (ex.: "01/06/2026" ou "01/junho").
   - O número do termo aditivo fica no cadastro do contrato (não é perguntado todo mês).

7. EXEMPLOS REAIS:
   (preencher com PRDs reais quando disponíveis)
```

---

### Para mim (referência técnica)

Ao receber uma ficha, classifico cada regra do item 5:

- **A** — marcador simples (`<<>>` / `{}`): sem código, só cadastrar o tipo na tela.
- **B** — condicional já suportada (estilo termo aditivo): sem código.
- **C** — regra nova de lógica: ajuste no motor `lib/template.ts` + testes.

Tokens reservados hoje (comportamento embutido no código): `<<termo>>`, `{textocontrato}`,
`{textotermoadtivo}`. Se muitos tipos trouxerem regras **C** diferentes, vale generalizar o motor
numa mini-linguagem de regras — decisão a tomar só depois de ver 2-3 tipos reais.
