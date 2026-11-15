# Euriptus

Simulador educacional multiplayer da cadeia produtiva do café, feito para estudantes de
aproximadamente 16 anos. Grupos administram empresas que percorrem quatro etapas:
**Produtor → Logística → Beneficiamento → Venda**.

O jogo acontece em rodadas abertas e fechadas pelo professor, que também configura
parâmetros econômicos e dispara eventos. Toda ação registra quem a executou. Não há chat:
as negociações serão feitas por propostas formais (oferta → aceite).

> **Nome provisório.** "Euriptus" é um placeholder e pode ser trocado sem impacto na
> arquitetura.

**Status:** iteração 1 concluída — autenticação, empresas, layout base e páginas iniciais.
Rodadas, negociações, catálogo, banco, eventos e relatórios ainda **não** foram implementados.

---

## Sumário

- [Stack](#stack)
- [O que já funciona](#o-que-já-funciona)
- [Requisitos](#requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Credenciais de demonstração](#credenciais-de-demonstração)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Modelo de dados](#modelo-de-dados)
- [Autenticação e segurança](#autenticação-e-segurança)
- [Decisões de design](#decisões-de-design)
- [Testes manuais desta iteração](#testes-manuais-desta-iteração)
- [Deploy na Vercel + Neon](#deploy-na-vercel--neon)
- [Próximas iterações](#próximas-iterações)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Stack

| Camada        | Tecnologia                                              |
| ------------- | ------------------------------------------------------- |
| Framework     | Next.js **15.5** (App Router) + React 19 + TypeScript   |
| Estilo        | Tailwind CSS 3.4 + componentes no padrão **shadcn/ui**  |
| Banco         | PostgreSQL                                              |
| ORM           | Prisma 6.19                                             |
| Autenticação  | NextAuth 4 (Credentials Provider) + JWT + bcryptjs      |
| Validação     | Zod 4                                                   |
| Deploy        | Vercel + Neon                                           |

A UI é 100% em português (pt-BR), responsiva e acessível (desktop, tablet e celular).

---

## O que já funciona

- [x] Login por e-mail e senha, com mensagens de erro claras.
- [x] Sessão em JWT contendo `id`, `role` e `empresaId`.
- [x] Logout.
- [x] Middleware protegendo as rotas e bloqueando `/professor` para estudantes.
- [x] Dois perfis: `STUDENT` e `TEACHER`.
- [x] Layout autenticado com header, sidebar responsiva (drawer no celular) e navegação.
- [x] `/painel` com empresa, tipo, saldo, etapa da cadeia e área reservada para notícias.
- [x] `/professor` exclusivo para professores, listando as empresas (somente leitura).
- [x] Páginas placeholder navegáveis: Mercado, Negociações, Financeiro e Banco.
- [x] Migration inicial + seed idempotente.
- [x] Seed com 1 professor, 4 empresas e 1 estudante por empresa.
- [x] Lighthouse 100 em acessibilidade, boas práticas e SEO nas páginas auditadas
      (`/login`, `/painel`, `/professor`, `/mercado`).

**Fora do escopo desta iteração:** rodadas, propostas, negociações, catálogo, empréstimos,
eventos econômicos, notícias dinâmicas, Google OAuth, relatórios, gráficos e ranking.

---

## Requisitos

- **Node.js 20.19+ ou 22 LTS** (recomendado: 22 LTS; o projeto foi verificado também no
  Node 20.16, mas ferramentas de lint emitem aviso de engine nessa versão).
- **npm 10+**.
- **PostgreSQL 14+** local, via Docker ou um banco Neon.
- Git (opcional).

---

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

O `postinstall` executa `prisma generate` automaticamente.

### 2. Criar o banco de dados

Escolha **uma** das opções:

**Opção A — PostgreSQL local (já instalado):**

```bash
createdb euriptus
```

**Opção B — Docker:**

```bash
docker compose up -d
```

O `docker-compose.yml` sobe um PostgreSQL 16 em `localhost:5432` com usuário `postgres`,
senha `postgres` e banco `euriptus`.

**Opção C — Neon:** crie um projeto em [neon.tech](https://neon.tech) e copie as duas
connection strings (pooled e direta). Veja [Deploy](#deploy-na-vercel--neon).

### 3. Configurar as variáveis de ambiente

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Gere um segredo forte para o NextAuth:

```bash
# Linux/macOS
openssl rand -base64 32

# Windows/PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Edite `.env` e preencha `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL` e `NEXTAUTH_SECRET`.
Localmente, `DATABASE_URL` e `DIRECT_URL` podem ser iguais.

> Nunca comite o arquivo `.env`. Ele já está no `.gitignore`.

### 4. Aplicar migrations e seed

```bash
npx prisma migrate dev --name init   # cria/aplica migrations em desenvolvimento
npm run db:seed                      # popula contas e empresas de demonstração
```

Em um banco já migrado (por exemplo, Neon), use:

```bash
npm run db:deploy   # prisma migrate deploy, sem criar migrations
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Você será redirecionado para
`/login`.

### Reset completo do banco de desenvolvimento

```bash
npm run db:reset   # apaga, recria, aplica migrations e roda o seed
```

---

## Credenciais de demonstração

Todas as contas usam a senha **`senha123`** (padrão do seed em desenvolvimento).

| Perfil     | E-mail                          | Empresa                    | Tipo             | Saldo inicial |
| ---------- | ------------------------------- | -------------------------- | ---------------- | ------------- |
| Professor  | `professor@euriptus.com`        | —                          | `TEACHER`        | —             |
| Estudante  | `produtor@euriptus.com`         | Fazenda Boa Esperança      | `PRODUTOR`       | R$ 18.500,00  |
| Estudante  | `logistica@euriptus.com`        | Transportes Vale Verde     | `LOGISTICA`      | R$ 12.000,00  |
| Estudante  | `beneficiamento@euriptus.com`   | Beneficiadora Grão de Ouro | `BENEFICIAMENTO` | R$ 27.500,00  |
| Estudante  | `venda@euriptus.com`            | Café Aurora                | `VENDA`          | R$ 35.000,00  |

Em desenvolvimento, a tela de login exibe essas contas em um painel recolhível e permite
preenchê-las com um clique. Em produção o painel fica oculto, a menos que
`SHOW_DEMO_CREDENTIALS=true` seja definido explicitamente.

> Os saldos iniciais acima são uma escolha do seed para a demonstração. O schema mantém
> `saldo` com default `0`. Reexecutar o seed **não** sobrescreve saldos já existentes.

---

## Scripts

| Comando              | O que faz                                                        |
| -------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento em `http://localhost:3000`           |
| `npm run build`      | `prisma generate` + build de produção do Next.js                 |
| `npm run start`      | Sobe o build de produção                                         |
| `npm run lint`       | ESLint (Next.js + TypeScript)                                    |
| `npm run typecheck`  | Verificação de tipos com `tsc --noEmit`                          |
| `npm run db:generate`| Gera o Prisma Client                                             |
| `npm run db:migrate` | `prisma migrate dev` (cria migration em desenvolvimento)         |
| `npm run db:deploy`  | `prisma migrate deploy` (aplica migrations existentes)           |
| `npm run db:seed`    | Executa `prisma/seed.ts`                                         |
| `npm run db:studio`  | Abre o Prisma Studio                                             |
| `npm run db:reset`   | Recria o banco, aplica migrations e roda o seed                  |

---

## Variáveis de ambiente

| Variável                  | Obrigatória | Descrição                                                              |
| ------------------------- | ----------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`            | Sim         | Connection string usada pelo app em runtime. No Neon, prefira a pooled. |
| `DIRECT_URL`              | Sim         | Connection string direta (sem pooler), usada por migrations.            |
| `NEXTAUTH_URL`            | Sim         | URL pública da aplicação (`http://localhost:3000` em dev).              |
| `NEXTAUTH_SECRET`         | Sim         | Segredo para assinar o JWT. Gere com `openssl rand -base64 32`.         |
| `SHOW_DEMO_CREDENTIALS`   | Não         | `true` exibe as contas de demonstração na tela de login em produção.    |
| `SEED_PASSWORD`           | Não         | Senha aplicada pelo seed às contas de demonstração. Padrão: `senha123`. |
| `ALLOW_PROD_SEED`         | Não         | `true` permite rodar o seed com `NODE_ENV=production`.                  |

Exemplo mínimo de `.env` local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/euriptus?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/euriptus?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cole-aqui-o-segredo-gerado"
```

---

## Estrutura do projeto

```text
prisma/
  schema.prisma            # User, Empresa, enums
  seed.ts                  # dados de demonstração
  migrations/              # SQL versionado
src/
  app/
    (app)/                 # área autenticada (layout com header + sidebar)
      painel/
      professor/
      mercado/
      negociacoes/
      financeiro/
      banco/
    api/auth/[...nextauth]/route.ts
    login/
    layout.tsx
    page.tsx               # redireciona para /painel ou /login
    globals.css
  components/
    ui/                    # primitivas shadcn/ui
    app-shell.tsx          # header, sidebar, drawer mobile, logout
    ...
  lib/
    prisma.ts              # singleton do Prisma Client
    utils.ts               # cn, formatadores pt-BR
    empresa.ts             # rótulos e ordem da cadeia
    validations/auth.ts    # schema Zod do login
  server/
    auth/                  # options do NextAuth + sessão/guards
    repositories/          # acesso a dados (Prisma)
    services/              # regras de aplicação (ex.: autenticação)
  types/next-auth.d.ts     # augmentação de Session/JWT
  middleware.ts            # proteção de rotas na borda
```

Fluxo de uma requisição autenticada:

```text
Navegador
  → middleware (valida JWT / papel)
  → Server Component (requireUser / requireTeacher)
  → service
  → repository
  → Prisma
  → PostgreSQL
```

Server Components são o padrão. Client Components existem apenas onde há interação:
formulário de login, shell responsivo e primitivas Radix.

---

## Modelo de dados

### `User`

| Campo          | Tipo                | Observações                                      |
| -------------- | ------------------- | ------------------------------------------------ |
| `id`           | `String` (cuid)     | PK                                               |
| `nome`         | `String`            |                                                  |
| `email`        | `String` único      | Normalizado para minúsculas no login             |
| `passwordHash` | `String`            | bcrypt, custo 12; nunca retornado pela sessão    |
| `role`         | `STUDENT/TEACHER`   | default `STUDENT`                                |
| `empresaId`    | `String?`           | FK para `Empresa`; obrigatório para alunos na aplicação |
| `createdAt`    | `DateTime`          |                                                  |
| `updatedAt`    | `DateTime`          |                                                  |

### `Empresa`

| Campo       | Tipo                                                      | Observações      |
| ----------- | --------------------------------------------------------- | ---------------- |
| `id`        | `String` (cuid)                                           | PK               |
| `nome`      | `String` único                                            |                  |
| `tipo`      | `PRODUTOR / LOGISTICA / BENEFICIAMENTO / VENDA`           | etapa da cadeia  |
| `saldo`     | `Decimal(14,2)`                                           | default `0`      |
| `createdAt` | `DateTime`                                                |                  |
| `updatedAt` | `DateTime`                                                |                  |

Relação: `Empresa 1—N User`. `onDelete: SetNull`.

Os modelos futuros (`Rodada`, `Proposta`, `Transacao`, `Evento`, `Emprestimo`,
`CatalogoItem`) não foram criados nesta iteração de propósito. A base atual já permite
adicioná-los sem quebrar contratos:

- ids `cuid` em todas as entidades;
- enums nomeados para papéis e tipos;
- `Decimal(14,2)` para dinheiro;
- `createdAt`/`updatedAt` em todas as tabelas;
- usuários já identificados por `id` para registrar autoria de ações futuras.

---

## Autenticação e segurança

- **Credentials Provider** com e-mail/senha e sessão **JWT** (sem tabela de sessão,
  adequada a serverless).
- O token/sessão carrega `id`, `role` e `empresaId`; `passwordHash` nunca entra no JWT.
- Senhas com **bcrypt (12 rounds)** via `bcryptjs`. A escolha evita binários nativos no
  deploy serverless.
- **Defesa contra enumeração de usuários:** a mesma mensagem é exibida para e-mail
  inexistente ou senha errada; quando o e-mail não existe, um hash descartável é comparado
  para manter o tempo de resposta semelhante.
- **Validação Zod** compartilhada entre a tela e o `authorize`.
- **CSRF e cookies** gerenciados pelo NextAuth; nenhum endpoint de login foi escrito à mão.
- **Middleware** valida o JWT e o papel para `/professor`. As páginas revalidam no servidor
  com `requireUser`/`requireTeacher` (defesa em profundidade).
- **Formulário de login** usa `method="post"` e exibe aviso quando JavaScript está
  desabilitado, evitando que a senha apareça na URL em um submit nativo.
- Sessão expira em **8 horas**.
- `NEXTAUTH_SECRET` e `DATABASE_URL` vêm exclusivamente do ambiente.
- Header `robots: noindex` (aplicação privada).
- Seed bloqueado em produção, a menos que `ALLOW_PROD_SEED=true`; a senha do seed pode ser
  definida por `SEED_PASSWORD`.

**Observações de segurança para o futuro:**

- adicionar rate limiting no login;
- permitir troca/reset de senha;
- configurar CSP;
- registrar auditoria de ações nas futuras entidades (`Proposta`, `Transacao` etc. devem
  guardar o `userId` de quem executou);
- revisar a política de sessão/JWT ao migrar para Google OAuth.

### Troca futura para Google OAuth

A estrutura foi preparada para isso. O ponto de extensão está documentado em
`src/server/auth/options.ts`:

1. Adicionar `GoogleProvider` ao array `providers`.
2. Criar um callback `signIn` que localize o usuário pelo e-mail no banco e recuse contas
   não cadastradas (o cadastro continuará sendo responsabilidade do professor).
3. No callback `jwt`, carregar `role` e `empresaId` do banco quando o usuário vier de um
   provider OAuth (que não devolve esses campos).
4. Se contas forem criadas automaticamente, adicionar `PrismaAdapter` e a tabela `Account`.
5. Remover o Credentials Provider só ao final da migração.

Como o resto do app consome a sessão pelos mesmos campos, não será necessário refatorar
páginas, middleware ou guards.

---

## Decisões de design

1. **Next.js 15 em vez de 16.** O NextAuth estável (v4.24) é a opção madura para o App
   Router; a v5 ainda está em beta. O Next 15 também mantém compatibilidade com as
   ferramentas atuais de lint e shadcn/ui. A atualização para Next 16 + Auth.js pode ser
   feita depois, isolada na camada de autenticação.
2. **NextAuth v4 + JWT.** Menos infraestrutura, adequado à Vercel e suficiente para login
   por credenciais. `id`, `role` e `empresaId` são propagados em `jwt`/`session`.
3. **`bcryptjs` em vez de `bcrypt` nativo.** Mesma família de algoritmo, sem compilação
   nativa e sem problema de binário na Vercel.
4. **`empresaId` opcional no schema.** A regra "aluno precisa de empresa" é validada na
   aplicação. Isso permite criar um aluno antes de vinculá-lo a uma empresa e deixa
   professores sem empresa. A UI trata aluno sem empresa com um aviso.
5. **Professor sem empresa.** O professor não pertence a nenhuma empresa e pode acessar
   `/painel` em modo de leitura; nesse caso vê uma visão de professor com atalho para
   `/professor`. Os dados das empresas ficam no painel do professor.
6. **Estudante em `/professor` → `/painel?aviso=acesso-negado`.** Em vez de uma tela 403
   seca, o usuário volta ao painel com um alerta explicando a restrição. O middleware
   bloqueia antes da página e o Server Component revalida o papel.
7. **Placeholders são páginas reais.** Mercado, Negociações, Financeiro e Banco existem
   para que a navegação nunca leve a um 404 e para comunicar o que virá.
8. **Saldos iniciais no seed.** A demonstração fica mais útil com caixa realista. O default
   do schema continua `0`, e o seed não sobrescreve saldos em reexecuções.
9. **`Decimal(14,2)` para dinheiro.** Evita erros de ponto flutuante. A formatação pt-BR
   (`Intl.NumberFormat`) é centralizada em `src/lib/utils.ts`.
10. **Seed seguro em produção.** Bloqueado por `NODE_ENV`, com opção explícita
    `ALLOW_PROD_SEED` e senha configurável por `SEED_PASSWORD`.
11. **Credenciais de demonstração só em dev.** Em produção, o painel de contas só aparece
    com `SHOW_DEMO_CREDENTIALS=true`.
12. **Normalização de e-mail.** Trim + lowercase na validação e no login; o cadastro deve
    seguir a mesma regra no futuro.
13. **`/` redireciona.** Não há landing page pública nesta iteração: logado vai para
    `/painel`; deslogado vai para `/login`.
14. **PostCSS com override.** O Next 15 traz uma versão antiga do PostCSS; o projeto força
    a versão corrigida (8.5.33) por segurança.
15. **Prisma com `directUrl`.** Runtime usa a URL pooled (Neon), migrations usam a URL
    direta. Em local as duas podem ser iguais.

---

## Testes manuais desta iteração

Pré-requisito: banco migrado, seed aplicado e `npm run dev` rodando.

### 1. Acesso sem sessão

1. Abra `http://localhost:3000/painel` em uma janela anônima.
2. **Esperado:** redirecionar para `/login?callbackUrl=%2Fpainel`.
3. Abra `http://localhost:3000/professor` sem sessão.
4. **Esperado:** redirecionar para `/login` com `callbackUrl=/professor`.

### 2. Login inválido

1. Informe `produtor@euriptus.com` e uma senha errada.
2. **Esperado:** alerta "E-mail ou senha inválidos…", sem revelar se o e-mail existe.
3. Confirme que a URL permanece em `/login` (sem senha na query string).

### 3. Login de estudante

1. Entre com `produtor@euriptus.com` / `senha123`.
2. **Esperado:** `/painel` com "Olá, Ana", empresa **Fazenda Boa Esperança**, tipo
   **Produtor**, saldo **R$ 18.500,00** e a etapa 1 destacada na cadeia.
3. Confira no header: nome, empresa, tipo e botão **Sair**.
4. Na sidebar: Painel, Mercado, Negociações, Financeiro, Banco. Não deve existir
   "Painel do Professor".
5. Acesse `/professor` digitando na barra de endereços.
6. **Esperado:** voltar para `/painel?aviso=acesso-negado` com alerta "Acesso restrito".
7. Navegue por Mercado, Negociações, Financeiro e Banco.
8. **Esperado:** páginas placeholder coerentes, com retorno ao painel.

### 4. Login de professor

1. Saia e entre com `professor@euriptus.com` / `senha123`.
2. **Esperado:** `/painel` com a visão de professor e atalho para o Painel do Professor.
3. Confira a sidebar: item extra **Painel do Professor** em "Gestão".
4. Abra `/professor`.
5. **Esperado:** resumo com 4 empresas, 4 estudantes e saldo somado de **R$ 93.000,00**;
   cards das quatro empresas, ordenados por etapa, com saldo e quantidade de estudantes.
6. Confirme que não há botões de edição (somente leitura).

### 5. Logout

1. Clique em **Sair**.
2. **Esperado:** voltar para `/login` e, ao tentar `/painel`, ser redirecionado novamente
   para o login.

### 6. Responsividade

1. Abra o DevTools e simule um celular (por exemplo, 390 × 844).
2. **Esperado:** sidebar vira um drawer acionado pelo botão de menu no header.
3. Abra o drawer: navegação, usuário, empresa e botão de fechar devem estar visíveis e
   acessíveis; o fundo escurece e a página não deve rolar atrás do drawer.
4. Em tablet/desktop, a sidebar fixa aparece a partir de `lg` (1024 px).

### 7. Acessibilidade

1. Navegue apenas com `Tab`/`Shift+Tab` na tela de login e no painel.
2. **Esperado:** foco visível, labels associados aos campos, botão de mostrar/ocultar senha
   acessível, skip link "Pular para o conteúdo" no topo.
3. Lighthouse (Audits) em `/login`, `/painel`, `/professor` e `/mercado`.
4. **Esperado:** 100 em Accessibility, Best Practices e SEO. (Resultado obtido no Chrome
   durante a verificação.)

### 8. Banco e seed

1. Rode `npm run db:seed` novamente.
2. **Esperado:** sem erros; empresas e usuários continuam existindo; saldos modificados
   manualmente não são resetados; senhas voltam ao padrão do seed.
3. Rode `npm run db:reset` para restaurar tudo.

---

## Deploy na Vercel + Neon

### 1. Banco no Neon

1. Crie um projeto no [Neon](https://neon.tech) e um banco (`euriptus`).
2. Copie as connection strings:
   - **Pooled** (host com `-pooler`): vai em `DATABASE_URL`.
   - **Direct** (host sem pooler): vai em `DIRECT_URL`.
3. Inclua `sslmode=require` se o Neon não incluir.

### 2. Migrations e seed no banco de produção

Antes do primeiro deploy, rode localmente (ou em CI) apontando para o Neon:

```bash
# PowerShell
$env:DATABASE_URL="postgresql://...-pooler.../euriptus?sslmode=require"
$env:DIRECT_URL="postgresql://.../euriptus?sslmode=require"
npx prisma migrate deploy
```

Seed opcional (cria contas de demonstração):

```bash
# PowerShell
$env:ALLOW_PROD_SEED="true"
$env:SEED_PASSWORD="uma-senha-forte-e-unica"
npm run db:seed
```

Depois, remova `ALLOW_PROD_SEED` e `SEED_PASSWORD` do ambiente. **Não** use
`prisma migrate dev` em produção.

> Se você não quiser contas de demonstração em produção, crie o professor real com um
> script próprio ou pelo Prisma Studio antes de liberar o acesso.

### 3. Projeto na Vercel

1. Importe o repositório na Vercel.
2. Framework preset: **Next.js** (detectado automaticamente).
3. Configure as variáveis de ambiente em **Settings → Environment Variables**:

   | Variável                | Valor                                        |
   | ----------------------- | -------------------------------------------- |
   | `DATABASE_URL`          | connection string **pooled** do Neon          |
   | `DIRECT_URL`            | connection string **direta** do Neon          |
   | `NEXTAUTH_URL`          | `https://seu-projeto.vercel.app`              |
   | `NEXTAUTH_SECRET`       | segredo forte (`openssl rand -base64 32`)     |
   | `SHOW_DEMO_CREDENTIALS` | omitir (produção oculta as contas demo)       |

4. Build command: `npm run build` (já inclui `prisma generate`). O `postinstall` também
   gera o client.
5. Faça o deploy.
6. Teste login, logout, `/painel` e `/professor` com as contas reais.
7. Após validar, desative o seed em produção e troque quaisquer senhas de demonstração.

**Preview deployments:** `NEXTAUTH_URL` precisa corresponder à URL de cada ambiente. Para
múltiplos previews, configure a variável por ambiente na Vercel.

---

## Próximas iterações

Ordem sugerida, mantendo uma tela/feature por iteração:

1. **Mercado** — cotações, notícias e eventos (somente leitura no início).
2. **Negociações** — propostas formais com oferta → aceite e validação de saldo.
3. **Financeiro** — custos fixos, impostos, salários e extrato.
4. **Banco** — empréstimos, juros e parcelas.
5. **Painel do Professor completo** — cadastro/edição de empresas e estudantes.
6. **Rodadas** — abertura, fechamento e processamento.
7. **Eventos** — catálogo pré-cadastrado e disparo pelo professor.
8. **Relatórios e ranking.**

Cada iteração deve preservar os contratos atuais (schema, rotas, formato da sessão),
manter o padrão visual shadcn/ui, a responsividade e atualizar este README com novos
testes manuais.

---

## Limitações conhecidas

- Não há troca nem recuperação de senha nesta iteração.
- Não há rate limiting no login (recomendado antes de expor a aplicação publicamente).
- Mudanças de papel/empresa feitas diretamente no banco exigem novo login para o JWT
  refletir; as páginas continuam seguras porque revalidam no servidor.
- Sem tela de cadastro de empresas/usuários; tudo vem do seed.
- Sem testes automatizados ainda (foram feitos testes manuais e auditoria Lighthouse).
- O CLI do Prisma 6.19.3 possui um advisory **de desenvolvimento** em `deepmerge-ts`
  (usado por `@prisma/config`), sem impacto no client de runtime. Acompanhar a correção
  em versões futuras do Prisma.
- O Prisma 6.19 exibe um aviso de depreciação sobre a configuração de seed em
  `package.json#prisma`; a migração para `prisma.config.ts` acompanhará a atualização para
  o Prisma 7.
- No Node 20.16 (anterior ao 20.19), o servidor de desenvolvimento imprime o aviso
  `React encountered an empty buffer ... ArrayBuffer.prototype.detached`. É um aviso do
  modo de desenvolvimento do React 19, sem impacto em produção; desaparece no Node 20.19+
  ou 22 LTS (versões recomendadas em [Requisitos](#requisitos)).
- O nome "Euriptus" é provisório.
- Nenhuma ação de jogo (proposta, transação etc.) existe ainda; quando existirem, cada
  uma deverá registrar o `userId` responsável, conforme o requisito de auditoria.

---

## Uso educacional

Projeto privado, sem fins comerciais. Nenhum dinheiro real é movimentado. Os dados de
demonstração são fictícios.
