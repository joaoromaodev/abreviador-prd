# Abreviador de PRDs

Aplicação web para escrever um texto (tipicamente um PRD) e abreviá-lo automaticamente até
caber em um limite de caracteres configurável (padrão: **1320**), usando um dicionário de
palavras/frases → abreviações cadastrado pelo próprio usuário.

Se mesmo depois de aplicar todas as abreviações cadastradas o texto ainda exceder o limite,
o sistema **não trunca nada**: mostra um aviso claro informando quantos caracteres ainda
precisam ser cortados, junto com o texto já compactado, para o usuário editar manualmente.

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
- Persistência em **localStorage** (sem backend), isolada em [`lib/storage.ts`](./lib/storage.ts)
  e [`hooks/useLocalStorageState.ts`](./hooks/useLocalStorageState.ts) — para migrar para um
  backend no futuro basta reimplementar essas duas funções (`readStorage`/`writeStorage`) com
  chamadas de API; o resto da aplicação não muda.

## Estrutura de pastas

```
app/
  layout.tsx          # layout raiz (nav entre as 4 abas) + metadata
  page.tsx             # aba "Abreviador" (rota /)
  palavras/page.tsx     # aba "Palavras / Abreviações" (rota /palavras)
  configuracoes/page.tsx# aba "Configurações" (rota /configuracoes)
  modelos/page.tsx      # aba "Modelos de PRDs" (rota /modelos)
  globals.css
components/
  NavBar.tsx            # navegação entre as abas
  ui.tsx                # primitivos de UI reutilizados nas 4 telas (Card, Botao, CampoTexto, ...)
hooks/
  useLocalStorageState.ts # estado React sincronizado com localStorage (useSyncExternalStore)
lib/
  abbreviation.ts        # lógica pura de abreviação + verificação de limite
  abbreviation.test.ts   # testes unitários (Vitest)
  constants.ts            # chaves de storage e configuração padrão
  id.ts                   # geração de id
  storage.ts               # leitura/escrita em localStorage (camada isolada)
  types.ts                  # tipos compartilhados (PalavraAbreviacao, Configuracoes, ModeloPRD)
```

## Rodando localmente

Pré-requisitos: Node.js 18.18+ (recomendado: o mesmo major usado no desenvolvimento, Node 24).

```bash
npm install
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
3. A Vercel detecta automaticamente que é um projeto Next.js — não é necessário configurar
   build command, output directory nem variáveis de ambiente (a aplicação não usa nenhuma).
4. Deploy.

Como toda a persistência é local ao navegador (localStorage), não há banco de dados ou
variável de ambiente a configurar — qualquer instância do deploy funciona de forma independente
por usuário/navegador.
