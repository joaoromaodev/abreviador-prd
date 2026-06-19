# Abreviador de PRDs

Aplicação web para escrever um texto (tipicamente um PRD) e abreviá-lo automaticamente até
caber em um limite de caracteres configurável (padrão: **1320**), usando um dicionário de
palavras/frases → abreviações cadastrado pela equipe.

Se mesmo depois de aplicar todas as abreviações cadastradas o texto ainda exceder o limite,
o sistema **não trunca nada**: mostra um aviso claro informando quantos caracteres ainda
precisam ser cortados, junto com o texto já compactado, para o usuário editar manualmente.

As palavras, configurações e modelos de PRD são **compartilhados entre todo mundo que acessa
o app** — ficam guardados numa planilha do Google Sheets, não no navegador de cada pessoa.

## Funcionalidades

- **Abreviador** (`/`): caixa de texto + botão "Abreviar". Mostra o texto resultante, o
  contador de caracteres (`X / limite`, fica vermelho quando excede) e um botão para copiar.
- **Palavras / Abreviações** (`/palavras`): cadastro (CRUD) de pares `palavra → abreviação`,
  com busca. Aceita frases inteiras (ex.: "Recursos Humanos" → "RH"). A substituição respeita
  fronteira de palavra (não abrevia pedaços de outras palavras) e tenta preservar a
  capitalização original (maiúsculas, capitalizada ou minúscula).
- **Configurações** (`/configuracoes`): limite de caracteres (padrão 1320), diferenciar ou não
  maiúsculas/minúsculas na hora de casar as palavras, e se as abreviações devem ser reaplicadas
  até estabilizar (útil quando a abreviação de uma entrada coincide com outra palavra
  cadastrada). Estrutura pronta para novas configurações no futuro.
- **Modelos de PRDs** (`/modelos`): salvar, editar e remover modelos de texto (nome +
  conteúdo) e carregar um deles como ponto de partida na aba Abreviador.

## Como funciona a abreviação

A lógica vive em [`lib/abbreviation.ts`](./lib/abbreviation.ts):

1. As entradas do dicionário são ordenadas da mais longa para a mais curta, para que frases
   (ex.: "Recursos Humanos") tenham prioridade sobre uma palavra isolada que seria uma
   substring dela (ex.: "Recursos").
2. Uma única expressão regular combinada (um grupo nomeado por entrada) varre o texto em uma
   passada, casando por fronteira de token (não casa um pedaço de outra palavra) e
   capturando a capitalização original para decidir a capitalização da abreviação.
3. Se a opção "reaplicar até estabilizar" estiver ligada, o processo roda novamente sobre o
   resultado (até 5 vezes ou até não haver mais mudanças), permitindo abreviações encadeadas.
4. O texto resultante é comparado ao limite configurado (`verificarLimite`); se ainda exceder,
   a UI mostra o aviso com o texto compactado e quantos caracteres faltam cortar.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) para estilos
- [Vitest](https://vitest.dev/) para testes unitários da lógica de abreviação/limite
- **Backend: Google Sheets**, acessado via Route Handlers do Next.js (`app/api/*`) usando a
  [Google Sheets API](https://developers.google.com/sheets/api) com uma *Service Account*
  (sem login do usuário — o backend lê/escreve direto na planilha). Camada de acesso em
  [`lib/sheets/`](./lib/sheets); cada aba da planilha (Palavras, Modelos, Configuracoes) é
  criada automaticamente, com cabeçalho, na primeira chamada se ainda não existir.
- O único dado que continua em `localStorage` é o rascunho temporário usado para levar o
  conteúdo de um modelo da aba "Modelos de PRDs" até a caixa de texto do Abreviador — é uma
  conveniência de navegação local, não dado compartilhado (ver [`lib/storage.ts`](./lib/storage.ts)).

## Backend: Google Sheets

O app lê e escreve numa planilha do Google Sheets através de uma *Service Account* do Google
Cloud (uma "conta robô" com acesso só àquela planilha, sem precisar de login interativo).

### 1. Criar a Service Account

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto (ou
   use um existente).
2. Habilite a [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
   nesse projeto.
3. Vá em **APIs & Services → Credentials → Create Credentials → Service Account**. Não
   precisa atribuir nenhuma role de projeto.
4. Na service account criada, aba **Keys → Add Key → Create new key**, tipo **JSON**. Isso
   baixa um arquivo com (entre outros) os campos `client_email` e `private_key`.
5. Compartilhe a planilha de destino com o `client_email` da service account, como **Editor**.

### 2. Variáveis de ambiente

Veja [`.env.example`](./.env.example). Três variáveis:

| Variável | De onde vem |
| --- | --- |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | campo `client_email` do JSON da service account |
| `GOOGLE_SHEETS_PRIVATE_KEY` | campo `private_key` do JSON da service account |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | o trecho da URL da planilha: `.../spreadsheets/d/ESTE_TRECHO/edit` |

Localmente: copie `.env.example` para `.env.local` e preencha. Na Vercel: Project Settings →
Environment Variables.

### 3. Estrutura da planilha

Não precisa criar nada manualmente — na primeira chamada à API, cada aba (`Palavras`,
`Modelos`, `Configuracoes`) é criada automaticamente com o cabeçalho certo, se ainda não
existir. As abas usadas são:

- **Palavras**: `id | palavra | abreviacao`
- **Modelos**: `id | nome | conteudo | criadoEm | atualizadoEm`
- **Configuracoes**: `chave | valor` (linhas `limiteCaracteres`, `caseSensitive`,
  `reaplicarAteEstabilizar`)

## Estrutura de pastas

```
app/
  layout.tsx               # layout raiz (nav entre as 4 abas) + metadata
  page.tsx                  # aba "Abreviador" (rota /)
  palavras/page.tsx          # aba "Palavras / Abreviações" (rota /palavras)
  configuracoes/page.tsx     # aba "Configurações" (rota /configuracoes)
  modelos/page.tsx           # aba "Modelos de PRDs" (rota /modelos)
  api/
    palavras/route.ts         # GET (listar) / POST (criar)
    palavras/[id]/route.ts     # PUT (editar) / DELETE (remover)
    modelos/route.ts            # GET / POST
    modelos/[id]/route.ts        # PUT / DELETE
    configuracoes/route.ts        # GET / PUT
  globals.css
components/
  NavBar.tsx                 # navegação entre as abas
  ui.tsx                      # primitivos de UI reutilizados nas 4 telas (Card, Botao, CampoTexto, ...)
hooks/
  usePalavras.ts              # estado + chamadas à API de palavras
  useModelos.ts                 # idem, modelos
  useConfiguracoes.ts             # idem, configurações
lib/
  abbreviation.ts              # lógica pura de abreviação + verificação de limite
  abbreviation.test.ts          # testes unitários (Vitest)
  api-errors.ts                  # helper de mensagem de erro para as rotas de API
  constants.ts                    # chave de storage do rascunho e configuração padrão
  id.ts                            # geração de id
  storage.ts                        # leitura/escrita em localStorage (só o rascunho)
  types.ts                           # tipos compartilhados (PalavraAbreviacao, Configuracoes, ModeloPRD)
  sheets/
    client.ts                        # autenticação (Service Account) + cliente da Sheets API
    table.ts                          # CRUD genérico por linha (cria aba/cabeçalho sob demanda)
    palavras.ts                        # CRUD de palavras sobre a aba "Palavras"
    modelos.ts                          # CRUD de modelos sobre a aba "Modelos"
    configuracoes.ts                     # leitura/escrita da aba "Configuracoes" (chave/valor)
```

## Rodando localmente

Pré-requisitos: Node.js 18.18+ (recomendado: o mesmo major usado no desenvolvimento, Node 24).

```bash
npm install
cp .env.example .env.local   # preencha com os dados da service account (veja acima)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Outros comandos

```bash
npm run lint    # ESLint
npm run build   # build de produção
npm run start   # roda o build de produção localmente
npm run test    # testes unitários (Vitest)
```

## Deploy na Vercel

1. Suba este repositório para o GitHub (ou outro provedor suportado).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel detecta automaticamente que é um projeto Next.js.
4. Configure as 3 variáveis de ambiente (`GOOGLE_SHEETS_CLIENT_EMAIL`,
   `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`) em Project Settings →
   Environment Variables.
5. Deploy.

Como os dados ficam na planilha (não no navegador), todo mundo que acessa a URL do deploy vê
e edita o mesmo dicionário de palavras, configurações e modelos.
