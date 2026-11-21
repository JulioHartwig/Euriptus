# Euriptus

Simulador educacional multiplayer da cadeia produtiva do café, feito para estudantes de
aproximadamente 16 anos. Grupos administram empresas que percorrem quatro etapas:
**Produtor → Logística → Beneficiamento → Venda**.

O jogo acontece em rodadas abertas e fechadas pelo professor, que também configura
parâmetros econômicos e dispara eventos. Toda ação registra quem a executou. Não há chat:
as negociações serão feitas por propostas formais (oferta → aceite).

> **Nome provisório.** "Euriptus" é um placeholder e pode ser trocado sem impacto na
> arquitetura.

**Status:** iteração 11 concluída — autenticação, empresas, painel, financeiro, banco com
parcelas/quitação/resgate, mercado com produção mensal e melhorias, estoque avaliado,
histórico unificado, central de alertas, negociações, rodadas mensais, **painel do professor
completo** e **eventos econômicos**, com **deploy Vercel + Neon** funcionando. Verificações
automatizadas (`lint`, `typecheck`, smoke tests ampliados) e build de produção passam localmente.
Google OAuth permanece opcional/fora do escopo implementado.

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
- [Testes automatizados](#testes-automatizados)
- [Testes manuais](#testes-manuais)
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
- [x] `/painel` com cabeçalho da empresa (nome, tipo e saldo) e 4 indicadores: saldo,
      dívida total (empréstimos ativos), estoque total e rodada atual.
- [x] `/painel` com notícias do mercado ativas, com badge por tipo (mercado, evento, aviso).
- [x] `/professor` exclusivo para professores, com visão geral, atalhos de gestão e acesso
      aos módulos administrativos.
- [x] `/financeiro` com resumo do período (receitas, despesas, impostos, salários e
      resultado), custos fixos ativos e extrato com tipo, valor e autor.
- [x] `/banco` com taxas vigentes, limite de empréstimo (3× saldo), empréstimos parcelados
      (até 12 parcelas) com pagamento individual, quitação com desconto de 5%, aplicação e
      resgate com taxa de 5% na mesma rodada, simulações, toasts e listas de contratos.
- [x] `/mercado` com catálogo categorizado (insumo, produto, melhoria), preço fixo por etapa,
  compra com confirmação e feedback persistente (valor debitado, novo saldo e estoque),
  melhorias de capacidade/marketing e registro de produção limitado à capacidade do mês.
- [x] `/estoque` com quantidade, preço médio ponderado, valor contábil dos lotes e produção da rodada.
- [x] `/historico` com linha do tempo unificada de transações e produção, incluindo rodada e autor.
- [x] `/alertas` e sino no header, com pendências derivadas do estado atual (rodada, saldo,
  parcelas vencidas, propostas, capacidade e estoque de produto).
- [x] `/negociacoes` com propostas formais entre empresas (oferta → aceite/recusa/cancelamento),
  transferência atômica de estoque e dinheiro no aceite, valor contábil proporcional,
  multiplicador de marketing na receita da vendedora, autoria e transações.
- [x] `/professor/rodadas` para abertura e fechamento/processamento de rodadas mensais
  (competência `MM/AAAA`), pagamento automático de parcelas vencidas no fechamento e histórico.
- [x] `/professor/eventos` com templates pré-registrados, disparo de eventos pelo professor (com autoria e rodada atual, quando houver) e geração automática de notícia.
- [x] `/professor/noticias` com CRUD, ativação/desativação e remoção de notícias.
- [x] `/professor/parametros` com edição de parâmetros econômicos globais.
- [x] `/professor/catalogo` com CRUD de itens do catálogo (preço fixo por etapa).
- [x] `/professor/empresas` com CRUD de empresas e acesso ao detalhe consolidado por empresa.
- [x] `/professor/usuarios` com CRUD de usuários (criação/redefinição de senha, vínculo com empresa e regras de perfil).
- [x] `/professor/financeiro` com visão consolidada de saldos das empresas.
- [x] `/professor/banco` com visão consolidada de empréstimos e investimentos ativos por empresa.
- [x] Migrations incrementais (`init`, `noticias`, `financeiro`, `banco`, `mercado_catalogo`,
  `negociacoes`, `rodadas`, `eventos_economicos`, `melhorias_producao_parcelas`,
  `quantidade_transacao`, `backfill_estoque_valor`) + seed idempotente.
- [x] Seed com 1 professor, 4 empresas, 1 estudante por empresa, 3 notícias,
  5 parâmetros econômicos (incluindo desconto de quitação e taxa de resgate), 2 custos fixos
  por empresa, 2 lançamentos por empresa e 21 itens de catálogo (insumos, produtos e melhorias).
- [x] Lighthouse 100 em acessibilidade, boas práticas e SEO nas páginas auditadas
      (`/login`, `/painel`, `/professor`, `/mercado`).

**Fora do escopo:** efeitos econômicos automáticos complexos de eventos, transformação
automática entre etapas, rendimento passivo de investimentos por rodada, Google OAuth
(opcional), relatórios, gráficos e ranking, chat e troca/reembolso. O processamento de
rodadas aplica as regras básicas documentadas neste README.

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

| Comando               | O que faz                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento em `http://localhost:3000`           |
| `npm run build`       | `prisma generate` + build de produção do Next.js                 |
| `npm run start`       | Sobe o build de produção                                         |
| `npm run lint`        | ESLint (Next.js + TypeScript)                                    |
| `npm run typecheck`   | Verificação de tipos com `tsc --noEmit`                          |
| `npm run test:smoke`  | Smoke tests automatizados (`scripts/smoke-tests.ts`)             |
| `npm test`            | `lint` + `typecheck` + `test:smoke`                              |
| `npm run db:generate` | Gera o Prisma Client                                             |
| `npm run db:migrate`  | `prisma migrate dev` (cria migration em desenvolvimento)         |
| `npm run db:deploy`   | `prisma migrate deploy` (aplica migrations existentes)           |
| `npm run db:seed`     | Executa `prisma/seed.ts`                                         |
| `npm run db:studio`   | Abre o Prisma Studio                                             |
| `npm run db:reset`    | Recria o banco, aplica migrations e roda o seed                  |

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

### Integração com o Neon CLI (opcional)

Com o [Neon CLI](https://neon.com/docs/cli) autenticado, é possível vincular o projeto e puxar as
credenciais automaticamente:

```bash
neon login
neon init -y --org-id <org-id> --project-id <project-id> --branch production --services postgres
neon deploy
```

O `neon env pull`/`neon deploy` grava `DATABASE_URL` (pooled) e `DATABASE_URL_UNPOOLED`
(direta) no `.env`. Como este projeto usa `DIRECT_URL` para migrations (compatível com o
`directUrl` do Prisma), mantenha `DIRECT_URL` com o mesmo valor de `DATABASE_URL_UNPOOLED`:

```env
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://.../neondb?sslmode=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require"
```

Regras gerais: **pooled** (`-pooler`) para o runtime do app; **direta** para migrations
(`npx prisma migrate deploy`). O arquivo `.env` e o `.neon` já estão no `.gitignore`.

---

## Estrutura do projeto

```text
prisma/
  schema.prisma            # User, Empresa, Noticia, Transacao, CustoFixo, ParametroEconomico, Emprestimo, ParcelaEmprestimo, Investimento, CatalogoItem, EstoqueItem, ProducaoRodada, Proposta, Rodada, EventoTemplate, EventoAtivo
  seed.ts                  # dados de demonstração (empresas, usuários, notícias, parâmetros, financeiro, catálogo com produtos e melhorias)
  migrations/              # SQL versionado (11 migrations, incluindo parcelas, capacidade e estoque avaliado)
src/
  app/
    (app)/                 # área autenticada (layout com header + sidebar)
      painel/              # indicadores da empresa + notícias
      financeiro/          # resumo, custos fixos e extrato
      banco/               # empréstimos parcelados, quitação, investimentos, resgates e Server Actions
      mercado/             # catálogo categorizado, compras, melhorias e produção mensal
      estoque/             # quantidades, preço médio e valor contábil por item
      historico/           # linha do tempo financeira + produção
      alertas/             # central de alertas derivada do estado atual
      negociacoes/         # propostas, aceite/recusa/cancelamento e Server Actions
      professor/
        eventos/           # templates e disparo de eventos econômicos
        noticias/          # CRUD e ativação de notícias
        parametros/        # edição de parâmetros econômicos
        catalogo/          # CRUD de itens do catálogo
        empresas/          # CRUD de empresas e detalhe consolidado por empresa
        usuarios/          # CRUD de usuários e vínculos
        rodadas/           # abertura, fechamento/processamento e histórico de rodadas
        financeiro/        # visão consolidada de saldos
        banco/             # visão consolidada de banco por empresa
    api/auth/[...nextauth]/route.ts
    login/
    layout.tsx
    page.tsx               # redireciona para /painel ou /login
    globals.css
  components/
    ui/                    # primitivas shadcn/ui (inclui alert-dialog e sonner)
    app-shell.tsx          # header com sino de alertas, sidebar, drawer mobile, logout
    noticia-lista.tsx      # feed de notícias reutilizado por aluno e professor
    ...
  lib/
    prisma.ts              # singleton do Prisma Client
    utils.ts               # cn, formatadores pt-BR (moeda, data, data/hora)
    empresa.ts             # rótulos e ordem da cadeia
    noticia.ts             # rótulos e badge por tipo de notícia
    financeiro.ts          # rótulos, badges e sinal por tipo de transação
    banco.ts               # limites, parcelas, desconto, resgate, rótulos e estado das ações
    mercado.ts             # categorias, cálculos e estado das ações do mercado
    negociacao.ts          # rótulos/status e estado das ações de negociação
    rodada.ts              # competência mensal, formatação e estado das ações de rodada
    validations/auth.ts    # schema Zod do login
    validations/banco.ts   # schemas Zod de empréstimo parcelado, parcela, quitação, aplicação e resgate
    validations/mercado.ts # schemas Zod de compra e produção
    validations/negociacao.ts # schemas Zod de proposta/resposta
    validations/professor.ts # schemas Zod de gestão (notícias, parâmetros, catálogo, empresas, usuários, eventos)
  server/
    auth/                  # options do NextAuth + sessão/guards
    repositories/          # acesso a dados (Prisma), incl. evento-repository
    services/              # regras de aplicação e administração (aluno, rodada, eventos e gestão do professor)
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

| Campo                  | Tipo                                                      | Observações                                  |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `id`                   | `String` (cuid)                                           | PK                                           |
| `nome`                 | `String` único                                            |                                              |
| `tipo`                 | `PRODUTOR / LOGISTICA / BENEFICIAMENTO / VENDA`           | etapa da cadeia                              |
| `saldo`                | `Decimal(14,2)`                                           | default `0`                                  |
| `capacidadeProducao`   | `Int`                                                     | soma das melhorias compradas                 |
| `multiplicadorMarketing` | `Decimal(14,4)`                                         | multiplicador da receita de vendas           |
| `createdAt`            | `DateTime`                                                |                                              |
| `updatedAt`            | `DateTime`                                                |                                              |

Relação: `Empresa 1—N User`. `onDelete: SetNull`.

### `Noticia`

| Campo      | Tipo                        | Observações                                   |
| ---------- | --------------------------- | --------------------------------------------- |
| `id`       | `String` (cuid)             | PK                                            |
| `titulo`   | `String`                    |                                               |
| `corpo`    | `String`                    | parágrafos separados por linha em branco      |
| `tipo`     | `MERCADO / EVENTO / AVISO`  | default `MERCADO`                             |
| `ativa`    | `Boolean`                   | default `true`; só as ativas vão para o aluno |
| `criadoEm` | `DateTime`                  | default `now()`                               |

Notícias são **globais**: não têm `empresaId`, porque eventos e avisos valem para toda a
cadeia. O aluno vê apenas notícias ativas; o professor vê todas, com selo "Inativa".
Não há campo único em `titulo`; o seed evita duplicatas procurando pelo título.

### `Transacao`

| Campo              | Tipo                                                                 | Observações                                   |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------- |
| `id`               | `String` (cuid)                                                      | PK                                            |
| `empresaId`        | `String`                                                             | FK para `Empresa` (`onDelete: Cascade`)       |
| `tipo`             | `RECEITA / DESPESA / IMPOSTO / SALARIO / JUROS / EMPRESTIMO / INVESTIMENTO / RESGATE / PAGAMENTO_EMPRESTIMO` | define entrada ou saída do caixa |
| `descricao`        | `String`                                                             | texto exibido no extrato                      |
| `valor`            | `Decimal(14,2)`                                                      | sempre positivo; o sinal vem do `tipo`        |
| `quantidade`       | `Int?`                                                               | preenchida em compras/vendas                  |
| `rodadaId`         | `String?`                                                            | FK opcional para `Rodada` (`onDelete: SetNull`) |
| `criadoEm`         | `DateTime`                                                           | default `now()`                               |
| `criadoPorUserId`  | `String`                                                             | FK para `User`; atende à auditoria            |

### `CustoFixo`

| Campo       | Tipo            | Observações                              |
| ----------- | --------------- | ---------------------------------------- |
| `id`        | `String` (cuid) | PK                                       |
| `empresaId` | `String`        | FK para `Empresa` (`onDelete: Cascade`)  |
| `descricao` | `String`        | ex.: "Aluguel do galpão"                 |
| `valor`     | `Decimal(14,2)` | valor recorrente por aplicação           |
| `ativo`     | `Boolean`       | default `true`                           |

### `ParametroEconomico`

| Campo       | Tipo            | Observações                                        |
| ----------- | --------------- | -------------------------------------------------- |
| `id`        | `String` (cuid) | PK                                                 |
| `nome`      | `String` único  | `JUROS_MENSAL`, `IMPOSTO_PERCENTUAL`, `SALARIO_MINIMO` |
| `valor`     | `Decimal(14,4)` | percentuais como fração (0,08 = 8%)                |
| `descricao` | `String`        | explicação exibida na futura gestão                |

### `Emprestimo`

| Campo              | Tipo                   | Observações                                               |
| ------------------ | ---------------------- | --------------------------------------------------------- |
| `id`               | `String` (cuid)        | PK                                                        |
| `empresaId`        | `String`               | FK para `Empresa` (`onDelete: Cascade`)                   |
| `valorPrincipal`   | `Decimal(14,2)`        | valor creditado no saldo                                   |
| `taxaJurosMensal`  | `Decimal(14,4)`        | snapshot do `JUROS_MENSAL` no momento da contratação      |
| `totalDevido`      | `Decimal(14,2)`        | principal × (1 + taxa × parcelas)                         |
| `status`           | `ATIVO / QUITADO`      | quitação manual com desconto ou por parcelas/rodada       |
| `criadoEm`         | `DateTime`             |                                                           |
| `criadoPorUserId`  | `String`               | FK para `User`; atende à auditoria                        |

### `ParcelaEmprestimo`

| Campo               | Tipo                   | Observações                                             |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `id`                | `String` (cuid)        | PK                                                      |
| `emprestimoId`      | `String`               | FK para `Emprestimo` (`onDelete: Cascade`)              |
| `numero`            | `Int`                  | sequência da parcela                                    |
| `valor`             | `Decimal(14,2)`        | valor da parcela                                        |
| `vencimento`        | `DateTime`             | competência mensal de vencimento                        |
| `status`            | `PENDENTE / PAGA`      | controle de pagamento                                   |
| `valorPago`         | `Decimal(14,2)?`       | valor efetivamente pago (menor em caso de desconto)     |
| `pagaEm`            | `DateTime?`            | preenchida no pagamento                                 |
| `pagaPorUserId`     | `String?`              | FK para `User`; autor do pagamento                      |

### `Investimento`

| Campo                   | Tipo                      | Observações                                            |
| ----------------------- | ------------------------- | ------------------------------------------------------ |
| `id`                    | `String` (cuid)           | PK                                                     |
| `empresaId`             | `String`                  | FK para `Empresa` (`onDelete: Cascade`)                |
| `valorAplicado`         | `Decimal(14,2)`           | debitado do saldo no ato da aplicação                  |
| `taxaRendimentoMensal`  | `Decimal(14,4)`           | snapshot da taxa (JUROS_MENSAL ÷ 2)                    |
| `valorResgate`          | `Decimal(14,2)?`          | valor creditado no resgate                              |
| `rodadaCriacaoId`       | `String?`                 | FK da rodada da aplicação; define resgate antecipado    |
| `taxaResgateAplicada`   | `Decimal(14,4)?`          | snapshot da taxa cobrada no resgate                     |
| `status`                | `ATIVO / RESGATADO`       |                                                        |
| `criadoEm`              | `DateTime`                |                                                        |
| `resgatadoEm`           | `DateTime?`               |                                                        |
| `criadoPorUserId`       | `String`                  | FK para `User`                                         |
| `resgatadoPorUserId`    | `String?`                 | FK para `User`; autor do resgate                       |

### `CatalogoItem`

| Campo         | Tipo             | Observações                                              |
| ------------- | ---------------- | -------------------------------------------------------- |
| `id`          | `String` (cuid)  | PK                                                       |
| `nome`        | `String`         | nome do suprimento                                       |
| `descricao`   | `String`         | descrição curta                                          |
| `unidade`     | `String`         | ex.: lote, saco, pacote                                   |
| `preco`       | `Decimal(14,2)`  | preço fixo por unidade                                   |
| `empresaTipo` | `EmpresaTipo?`   | se nulo, disponível a todas; senão, restrito ao tipo     |
| `categoria`   | `INSUMO / PRODUTO / MELHORIA` | default `INSUMO`                               |
| `aumentoCapacidade` | `Int`     | ganho mensal quando a categoria é `MELHORIA`              |
| `aumentoMarketing` | `Decimal(14,4)` | ganho de receita nas vendas (ex.: `0,10` = 10%)           |
| `ativo`       | `Boolean`        | default `true`                                           |

### `EstoqueItem`

| Campo           | Tipo            | Observações                                           |
| --------------- | --------------- | ----------------------------------------------------- |
| `id`            | `String` (cuid) | PK                                                    |
| `empresaId`     | `String`        | FK para `Empresa` (`onDelete: Cascade`)               |
| `catalogoItemId`| `String`        | FK para `CatalogoItem` (`onDelete: Cascade`)          |
| `quantidade`    | `Int`           | quantidade agregada do item                            |
| `valorTotal`    | `Decimal(14,2)` | valor contábil do lote (base do preço médio)            |
| `atualizadoEm`  | `DateTime`      | atualizado a cada compra/produção/transferência         |

Relação única por (`empresaId`, `catalogoItemId`): compras e produção incrementam o mesmo
registro, com valor médio ponderado. Negociações transferem o valor proporcional ao destinatário.

### `ProducaoRodada`

| Campo                 | Tipo              | Observações                                              |
| --------------------- | ----------------- | -------------------------------------------------------- |
| `id`                  | `String` (cuid)   | PK                                                       |
| `empresaId`           | `String`          | FK para `Empresa` (`onDelete: Cascade`)                  |
| `rodadaId`            | `String`          | FK para `Rodada` (competência mensal)                    |
| `catalogoItemId`      | `String`          | FK para o produto/serviço produzido                      |
| `quantidade`          | `Int`             | unidades produzidas                                      |
| `capacidadeAplicada`  | `Int`             | capacidade total da empresa no momento                   |
| `criadoEm`            | `DateTime`        |                                                          |
| `criadoPorUserId`     | `String`          | FK para `User`; autor do registro                        |

### `Proposta`

| Campo                 | Tipo                                  | Observações                                              |
| --------------------- | ------------------------------------- | -------------------------------------------------------- |
| `id`                  | `String` (cuid)                       | PK                                                       |
| `empresaOrigemId`     | `String`                              | FK para `Empresa` (vendedora, `onDelete: Cascade`)       |
| `empresaDestinoId`    | `String`                              | FK para `Empresa` (compradora, `onDelete: Cascade`)      |
| `catalogoItemId`      | `String`                              | FK para `CatalogoItem`                                   |
| `quantidade`          | `Int`                                 | quantidade ofertada                                      |
| `valorTotal`          | `Decimal(14,2)`                       | valor total negociado                                    |
| `mensagem`            | `String?`                             | mensagem opcional (até 280 caracteres)                   |
| `status`              | `PENDENTE/ACEITA/RECUSADA/CANCELADA`  | estado da proposta                                       |
| `criadoEm`            | `DateTime`                            |                                                          |
| `criadoPorUserId`     | `String`                              | FK para `User` (autor da oferta)                         |
| `respondidoEm`        | `DateTime?`                           |                                                          |
| `respondidoPorUserId` | `String?`                             | FK para `User` (quem aceitou/recusou/cancelou)           |

### `Rodada`

| Campo               | Tipo              | Observações                                              |
| ------------------- | ----------------- | -------------------------------------------------------- |
| `id`                | `String` (cuid)   | PK                                                       |
| `numero`            | `Int`             | único, incremental                                       |
| `competencia`       | `DateTime?`       | primeiro dia do mês (`MM/AAAA` na UI)                    |
| `status`            | `ABERTA/FECHADA`  | apenas uma rodada aberta por vez                         |
| `abertaEm`          | `DateTime`        |                                                          |
| `abertaPorUserId`   | `String`          | FK para `User` (professor)                               |
| `fechadaEm`         | `DateTime?`       | preenchido no fechamento/processamento                   |
| `fechadaPorUserId`  | `String?`         | FK para `User` (professor)                               |

### `EventoTemplate`

| Campo          | Tipo                      | Observações                                      |
| -------------- | ------------------------- | ------------------------------------------------ |
| `id`           | `String` (cuid)           | PK                                               |
| `titulo`       | `String`                  |                                                  |
| `descricao`    | `String`                  | texto-base do evento/notícia                     |
| `tipoNoticia`  | `MERCADO/EVENTO/AVISO`    | default `EVENTO`                                 |
| `impactoTexto` | `String?`                 | descrição opcional do impacto orientativo        |
| `ativo`        | `Boolean`                 | default `true`                                   |
| `criadoEm`     | `DateTime`                |                                                  |
| `atualizadoEm` | `DateTime`                |                                                  |

### `EventoAtivo`

| Campo                | Tipo            | Observações                                              |
| -------------------- | --------------- | -------------------------------------------------------- |
| `id`                 | `String` (cuid) | PK                                                       |
| `templateId`         | `String`        | FK para `EventoTemplate`                                 |
| `rodadaId`           | `String?`       | FK opcional para `Rodada` (rodada aberta no disparo)     |
| `noticiaId`          | `String?`       | FK opcional para `Noticia` gerada automaticamente        |
| `disparadoEm`        | `DateTime`      |                                                          |
| `disparadoPorUserId` | `String`        | FK para `User` (professor; autoria do disparo)           |

Todas as entidades de negócio listadas acima já existem, incluindo `ParcelaEmprestimo`,
`ProducaoRodada` e `Transacao.quantidade`, adicionadas na iteração 11. A base permite evoluir
regras e novos efeitos sem quebrar contratos:

- ids `cuid` em todas as entidades;
- enums nomeados para papéis, tipos de empresa, tipos de notícia e tipos de transação;
- `Decimal(14,2)` para dinheiro e `Decimal(14,4)` para percentuais;
- `createdAt`/`updatedAt` nas entidades principais;
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
   `/professor`. Os dados e a gestão das empresas ficam no painel do professor.
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
16. **Notícias globais, sem `empresaId`.** Eventos e avisos valem para toda a cadeia, então
    a notícia não pertence a uma empresa. Isso também permite reaproveitar o mesmo feed no
    painel do aluno e na leitura do professor.
17. **`Noticia.titulo` sem `@unique`.** O título é conteúdo editorial e pode se repetir no
    futuro. A idempotência do seed é feita com uma busca por título antes de criar, sem
    impor uma restrição que limitaria a gestão de notícias na Etapa 8.
18. **Notícias de exemplo no seed.** As três notícias iniciais são estáticas e deixam claro
    no próprio texto que os efeitos de preço ainda não são automáticos. Elas cobrem os três
    tipos (`MERCADO`, `EVENTO`, `AVISO`) para validar a UI.
19. **Professor vê notícias inativas.** O professor enxerga todas as notícias (com indicação
    de inativas) e pode gerenciá-las em `/professor/noticias` (criar, editar, ativar/desativar
    e remover). O aluno vê apenas as ativas no painel.
20. **Indicadores "Dívida", "Estoque" e "Rodada" são estáticos nesta etapa.** Os valores
    (`R$ 0,00`, `0` e `—`) são intencionais e serão alimentados pelos módulos das Etapas
    4, 5 e 7. Não há dados falsos sendo inventados no painel.
21. **`Transacao.valor` é sempre positivo.** O tipo (`RECEITA`, `DESPESA` etc.) define o
    efeito no caixa, centralizado em `src/lib/financeiro.ts`. Isso simplifica somas,
    relatórios e o processamento de rodadas, sem valores negativos ambíguos.
22. **Resultado = receitas − despesas − impostos − salários.** Juros, empréstimos e
    investimentos são movimentos financeiros e entram no módulo Banco (Etapa 4) e no
    processamento de rodadas (Etapa 7). O resumo mostra apenas o resultado operacional.
23. **Lançamentos do seed não alteram o saldo.** O saldo inicial já representa o caixa
    depois desses lançamentos ilustrativos. Assim o seed permanece idempotente e não
    desfaz alterações de saldo feitas durante os testes; o README explica a escolha.
24. **`rodadaId` com relação opcional à `Rodada`.** Transações criadas enquanto há rodada
    aberta são vinculadas à rodada corrente; lançamentos do seed/históricos podem ficar sem
    rodada. O resumo financeiro continua agregando os lançamentos da empresa.
25. **Percentuais com 4 casas decimais.** `ParametroEconomico.valor` usa
    `Decimal(14,4)` para representar 2%, 1,5% ou 0,25% sem arredondamento prematuro.
    O seed usa `create` (não sobrescreve) para preservar futuras edições do professor.
26. **Custos fixos visíveis e aplicados no processamento.** Custos fixos ativos continuam
    visíveis no financeiro e são debitados automaticamente no fechamento/processamento da
    rodada (com transações `DESPESA` vinculadas à rodada).
27. **Taxa do contrato é um snapshot.** `Emprestimo.taxaJurosMensal` e
    `Investimento.taxaRendimentoMensal` guardam a taxa vigente no momento da operação,
    para que futuras alterações de `JUROS_MENSAL` não mudem contratos já firmados.
28. **Rendimento = metade dos juros.** O investimento rende `JUROS_MENSAL / 2` (1% ao mês
    com a seed atual). O resgate, nesta etapa, paga principal + 1 mês de rendimento e fica
    disponível imediatamente; o rendimento por rodada chega na Etapa 7 (e, até lá, repetir
    aplicar→resgatar produz 1% por ciclo — simplificação documentada).
29. **Limite de empréstimo = 3× saldo atual.** O limite considera apenas o saldo no momento
    da solicitação e não subtrai dívidas existentes (requisito literal). O crédito do
    empréstimo entra no saldo imediatamente e a quitação automática por rodada chega na
    Etapa 7.
30. **`RESGATE` como tipo de transação.** Resgates são entradas de caixa; foi adicionado o
    valor `RESGATE` ao enum de `TransacaoTipo` (adição, sem quebra de contrato) para
    diferenciar do débito de `INVESTIMENTO`.
31. **Operações atômicas com trava de saldo/status.** Débito de aplicação usa
    `updateMany` condicionado a saldo suficiente; resgate usa `updateMany` condicionado a
    `ATIVO`, evitando saldo negativo, duplo resgate e inconsistência em requisições
    concorrentes. Cada operação registra saldo/transação/contrato na mesma transação de BD.
32. **Server Actions como limite de confiança.** A UI usa formulários com `useActionState`,
    confirmação em `AlertDialog` e toasts (`sonner`), mas a autorização (sessão, papel
    STUDENT, vínculo com empresa) e as regras de negócio são revalidadas no servidor.
33. **Visão consolidada de banco no painel do professor.** `/professor/banco` exibe saldos,
    dívidas e investimentos ativos por empresa, com acesso ao detalhe consolidado da empresa;
    alunos permanecem bloqueados pelo guard de professor.
34. **Catálogo fixo e filtrado por etapa.** `CatalogoItem` possui preço fixo e pode ser
    restrito por `empresaTipo` (itens do produtor/logística/beneficiamento/venda); o seed
    cria 2 itens por tipo. Não há variação de preço nem CRUD nesta etapa.
35. **Compra atômica e sem reembolso.** A compra valida saldo e disponibilidade, debita com
    trava (`updateMany` condicionada ao saldo), registra transação `DESPESA` com autoria,
    incrementa `EstoqueItem` (único por empresa+item) e atualiza saldo/estoque na mesma
    transação de BD. Não há troca nem devolução, conforme regra do produto.
36. **Estoque como quantidade agregada.** O estoque é somado por item de catálogo e o
    indicador "Estoque total" do painel exibe a soma das quantidades; movimentações entre
    etapas/produção e vendas entram em iterações futuras (rodadas).
37. **Negociação por proposta formal (oferta → aceite).** A empresa vendedora envia proposta
    com item do próprio estoque, quantidade, valor total e mensagem opcional para outra empresa.
    A proposta nasce `PENDENTE`; o estoque não é reservado na criação (apenas validado),
    permitindo outras ofertas, mas o aceite exige disponibilidade no momento da confirmação.
38. **Aceite atômico com transferências e autoria.** Ao aceitar, em transação de BD: a proposta
    é travada como `ACEITA`, o estoque do vendedor é debitado, o saldo do comprador é debitado
    (com travas de disponibilidade), o vendedor recebe o valor, o comprador recebe os itens e
    são criadas transações `DESPESA` (comprador) e `RECEITA` (vendedor) com o respondente como
    autor. Recusa/cancelamento atualizam status com autoria (destinatário recusa, origem cancela).
39. **Sem troca/reembolso e sem chat.** Negociações ocorrem apenas por propostas formais; não há
    devolução, estorno nem mensagens em tempo real além da mensagem opcional da proposta.
    O detalhe consolidado da empresa (incluindo negociações/transações) está disponível no
    painel do professor.
40. **Ciclo de rodada (abertura/fechamento) controlado pelo professor.** Apenas uma rodada
    pode estar `ABERTA`; ao abrir cria-se a próxima numeração sequencial com autoria. O
    fechamento marca a rodada como `FECHADA`, registra autor/horário e executa o processamento.
41. **Processamento automático no fechamento (regras básicas).** Por empresa, gera transações
    vinculadas à rodada e debita saldo: custos fixos ativos (`DESPESA`), `SALARIO_MINIMO`
    (`SALARIO`), imposto `IMPOSTO_PERCENTUAL` sobre as `RECEITA`s da rodada (`IMPOSTO`) e,
    quando há saldo suficiente, quitação automática de empréstimos ativos (debita `totalDevido`,
    marca `QUITADO` e registra lançamento `JUROS`). Toda ação registra autoria do professor.
42. **Simplificações mantidas.** Investimentos não rendem automaticamente por rodada (resgate
    manual continua pagando principal + 1 mês conforme etapas anteriores). O processamento pode
    levar saldos a valores negativos em débitos automáticos; operações de negócio continuam
    exigindo saldo suficiente quando aplicável. Regras mais completas/equilíbrio seguem nas
    próximas iterações.
43. **Painel do professor completo (Etapa 8).** O professor pode gerenciar empresas, usuários,
    notícias, parâmetros econômicos e catálogo, além de abrir/fechar rodadas e consultar visões
    consolidadas (financeiro, banco e detalhe por empresa com usuários, estoque, dívida,
    investimentos/empréstimos, transações e propostas). Todas as ações administrativas são
    protegidas por guard de professor e revalidadas em Server Actions.
44. **Gestão de usuários com regras mínimas.** Estudantes devem estar vinculados a uma empresa;
    professores não possuem empresa. Senhas são armazenadas com bcrypt; na edição, a senha pode
    ser redefinida opcionalmente. CRUD de autenticação avançado (convites, recuperação de senha,
    políticas) segue fora do escopo atual.
45. **Eventos econômicos por template e disparo auditado (Etapa 9).** O professor cadastra
    `EventoTemplate`s pré-registrados (título, descrição, tipo/impacto orientativo e estado) e os
    dispara em `/professor/eventos`. O disparo cria `EventoAtivo` com autoria (`disparadoPorUserId`)
    e vínculo opcional à rodada aberta no momento, e publica automaticamente uma `Noticia` ativa
    correspondente no painel. Como simplificação, o disparo não aplica mutações econômicas
    automáticas complexas em saldos/estoques/preços; ajustes manuais via parâmetros ou catálogo
    permanecem possíveis.
46. **Empréstimos parcelados e quitação com desconto (iteração 11).** O contrato registrou prazo
    de até 12 meses, juros por parcela e uma `ParcelaEmprestimo` por mês, com autoria do
    pagamento. A quitação antecipada usa `DESCONTO_QUITACAO` (5% no seed); pagar parcela e quitar
    são operações atômicas com trava de status/saldo.
47. **Resgate na mesma rodada não rende.** `Investimento.rodadaCriacaoId` identifica o mês da
    aplicação. Se o resgate ocorrer na mesma competência, não há rendimento e é cobrada a taxa
    `TAXA_RESGATE_ANTECIPADO` (5% no seed). Em competência posterior, rende a taxa gravada no
    contrato. A UI mostra as duas simulações antes de confirmar.
48. **Rodada = competência mensal.** Cada abertura calcula o próximo mês a partir da última
    rodada (`proximaCompetencia`) e exibe `MM/AAAA`. No fechamento, são pagas automaticamente as
    parcelas vencidas no mês quando há saldo, além dos custos/salários/impostos já existentes.
49. **Capacidade mensal por tipo de empresa.** Produtor 100, Logística 60, Beneficiamento 80 e
    Venda 70 unidades por mês, somadas a `Empresa.capacidadeProducao`. A produção é registrada
    por `ProducaoRodada`, consome essa capacidade, gera estoque e é auditada.
50. **Estoque com valor contábil.** `EstoqueItem.valorTotal` acompanha a quantidade; compras e
    produção usam média ponderada por incremento de valor. A vendedora transfere ao comprador o
    valor proporcional à quantidade negociada, mantendo o custo contábil ao longo da cadeia.
51. **Marketing afeta receita, não custo.** Melhorias da empresa de venda aumentam
    `multiplicadorMarketing`; no aceite da proposta, a receita creditada à vendedora é
    `valorTotal × multiplicador`, enquanto o comprador paga exatamente o valor negociado.
52. **Alertas calculados, não persistidos.** `/alertas` e o sino do header derivam avisos do
    estado atual do banco (rodada aberta, saldo baixo, parcelas vencidas, propostas pendentes,
    capacidade esgotada e falta de produto em estoque). Não há modelo `Alerta`, nem sino com
    dropdown: o ícone é um link direto para a central.
53. **Histórico unificado e `Transacao.quantidade`.** `/historico` cruza lançamentos financeiros
    e registros de produção em uma linha do tempo com rodada e autor. A coluna `quantidade` é
    opcional e preenchida em compras/vendas, sem alterar a regra de `valor` sempre positivo.

---

## Testes automatizados

- `npm run test:smoke`: executa `scripts/smoke-tests.ts` (via `tsx`) cobrindo regras puras e
  validações críticas: arredondamento, empréstimos parcelados, quitação, resgate antecipado,
  competência mensal, capacidade-base, sinal das transações, total de compra e schemas de
  proposta, compra, empréstimo e catálogo com melhorias.
- `npm test`: executa `lint` + `typecheck` + `test:smoke` como verificação automatizada.
- `npm run build`: verificação adicional de integração/compilação para produção (inclui `prisma generate`).

> Observação: não há suíte E2E completa nem testes de integração com banco nesta etapa; os fluxos principais permanecem cobertos por testes manuais documentados abaixo.

## Testes manuais

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
   **Produtor** e saldo **R$ 18.500,00** no cabeçalho.
3. Confira os 4 indicadores: **Saldo atual** R$ 18.500,00, **Dívida total** R$ 0,00,
   **Estoque total** 0 e **Rodada atual** —.
4. Confirme que a seção **Notícias do mercado** lista as 3 notícias do seed, cada uma com
   badge de tipo e data.
5. Confira no header: nome, empresa, tipo e botão **Sair**.
6. Na sidebar: Painel, Mercado, Negociações, Financeiro, Banco. Não deve existir
   "Painel do Professor".
7. Acesse `/professor` digitando na barra de endereços.
8. **Esperado:** voltar para `/painel?aviso=acesso-negado` com alerta "Acesso restrito".
9. Navegue por Mercado, Negociações, Financeiro e Banco.
10. **Esperado:** páginas funcionais/coerentes da área do estudante, com navegação consistente.

### 4. Login de professor

1. Saia e entre com `professor@euriptus.com` / `senha123`.
2. **Esperado:** `/painel` com a visão de professor e atalho para o Painel do Professor.
3. Confira a sidebar: item extra **Painel do Professor** em "Gestão".
4. Abra `/professor`.
5. **Esperado:** resumo com 4 empresas, 4 estudantes e saldo somado de **R$ 93.000,00**;
   cards das quatro empresas, ordenados por etapa, com saldo e quantidade de estudantes.
6. Confirme o acesso aos módulos de gestão (rodadas, empresas, usuários, parâmetros, catálogo, notícias, financeiro e banco).

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
3. **Esperado:** nenhuma duplicação — notícias `0 criada(s)`, parâmetros `0 criado(s)`,
   custos fixos e transações `0` criados.
4. Rode `npm run db:reset` para restaurar tudo.

### 9. Notícias e visão do professor

1. Entre como `professor@euriptus.com` / `senha123` e abra `/professor`.
2. **Esperado:** seção **Notícias do mercado** com as notícias, badges de tipo/estado e o botão
   **Gerenciar notícias**.
3. Clique em **Gerenciar notícias**.
4. **Esperado:** tela de gestão `/professor/noticias` (criar, editar, ativar/desativar e remover).
5. Crie ou edite uma notícia e altere seu status.
6. **Esperado:** notícias ativas aparecem no painel do aluno; inativas permanecem visíveis apenas
   para o professor.

### 10. Estado sem notícias / sem empresa

1. Desative todas as notícias: `UPDATE "Noticia" SET ativa = false;`.
2. No painel do aluno, **esperado:** estado vazio "Nenhuma notícia publicada" e contador
   de publicadas oculto.
3. Para simular aluno sem empresa, remova o vínculo:
   `UPDATE "User" SET "empresaId" = NULL WHERE email = 'produtor@euriptus.com';`.
4. Recarregue `/painel` (a sessão busca o usuário no banco a cada requisição).
5. **Esperado:** aviso "Sua conta ainda não está vinculada a uma empresa", sem os 4
   indicadores, mas com as notícias (se houver ativas).
6. Abra `/financeiro`: **esperado:** o mesmo aviso, sem resumo, custos ou extrato.
7. Restaure com `npm run db:seed` e reative as notícias no banco.

### 11. Financeiro do aluno

1. Entre como `produtor@euriptus.com` / `senha123` e abra `/financeiro`.
2. **Esperado:** resumo com **Receitas R$ 6.200,00**, **Despesas R$ 2.100,00**,
   impostos e salários **R$ 0,00** e **Resultado R$ 4.100,00**.
3. **Custos fixos ativos:** Arrendamento da fazenda (R$ 1.200,00) e Manutenção de
   equipamentos (R$ 450,00), total **R$ 1.650,00**.
4. **Extrato:** 2 lançamentos (venda de sacas e compra de insumos), com data, tipo e
   autor "Ana Produtora"; receita em verde com `+`, despesa em vermelho com `−`.
5. Repita para `venda@euriptus.com`: receitas R$ 7.200,00, despesas R$ 3.800,00,
   resultado R$ 3.400,00 e custos fixos de R$ 2.050,00.
6. Confira que o saldo da empresa **não** é recalculado a partir do extrato (os
   lançamentos do seed são históricos; ver decisão no README).

### 12. Financeiro do professor

1. Entre como `professor@euriptus.com` e abra `/financeiro`.
2. **Esperado:** aviso de visão do professor e botão **Abrir financeiro das empresas**.
3. Clique no botão (ou abra `/professor/financeiro`).
4. **Esperado:** tabela com as empresas, tipo, estudantes e saldo, com saldo somado no cabeçalho.
5. Abra `/professor` e confirme o botão **Financeiro** no cabeçalho.
6. Para detalhamento (extrato, estoque, banco e negociações por empresa), acesse `/professor/empresas`
   e abra **Detalhes**.

### 13. Banco — solicitação de empréstimo

1. Faça login como `produtor@euriptus.com` e acesse `/banco`.
2. **Esperado:** saldo R$ 18.500,00, limite R$ 55.500,00, dívida R$ 0,00, investimentos
   R$ 0,00, taxas de 2,00% (juros) e 1,00% (rendimento), estados vazios e aviso da etapa.
3. Informe R$ 1.000,00 em "Solicitar empréstimo" e clique em "Revisar empréstimo".
4. **Esperado:** `AlertDialog` mostra valor solicitado, juros 2,00% e total a pagar
   R$ 1.020,00.
5. Confirme em "Contratar empréstimo".
6. **Esperado:** toast de sucesso, saldo passa para R$ 19.500,00, dívida ativa
   R$ 1.020,00 (1 contrato ativo), limite sobe para R$ 58.500,00 e o contrato aparece
   como Ativo com principal R$ 1.000,00 e autor.

### 14. Banco — investimento, resgate e persistência

1. Com o estado do teste 13, informe R$ 500,00 em "Aplicar investimento" e revise.
2. **Esperado:** confirmação mostra valor aplicado, rendimento 1,00% e resgate estimado
   R$ 505,00.
3. Confirme em "Aplicar valor".
4. **Esperado:** toast de sucesso, saldo R$ 19.000,00, 1 aplicação ativa de R$ 500,00 com
   resgate previsto R$ 505,00.
5. Clique em "Resgatar" na aplicação e confirme "Resgatar investimento".
6. **Esperado:** toast de sucesso, saldo R$ 19.505,00, aplicação marcada como Resgatada
   com valor R$ 505,00 e autoria do resgate.
7. Recarregue `/banco`.
8. **Esperado:** saldo R$ 19.505,00, dívida R$ 1.020,00 e aplicação resgatada persistem.
9. Acesse `/painel` como aluno e `/banco` como professor.
10. **Esperado:** "Dívida total" no painel reflete R$ 1.020,00 (1 contrato ativo);
    professor vê a visão informativa e o atalho para `/professor/banco`; estudante sem
    permissão é bloqueado em `/professor/banco`.

### 15. Mercado — catálogo e compra

1. Com banco migrado/seedado e app rodando, faça login como `produtor@euriptus.com` e acesse `/mercado`.
2. **Esperado:** saldo R$ 18.500,00, estoque 0, 2 itens no catálogo da etapa (ex.: "Mudas de café" R$ 450,00 e "Adubo e defensivos" R$ 180,00), sem itens de outras etapas (ex.: combustível).
3. Clique em "Comprar" em "Mudas de café", informe quantidade 2 e confirme.
4. **Esperado:** diálogo mostra total R$ 900,00; após confirmar, toast de sucesso, saldo R$ 17.600,00, estoque passa a 2 (item agregado) e extrato em `/financeiro` registra a despesa "Compra: Mudas de café (2 unidades)" com autor.

### 16. Validações e visão do professor no mercado

1. Em `/mercado` (aluno), tente comprar quantidade acima do saldo disponível.
2. **Esperado:** confirmação bloqueada/erro de saldo insuficiente; saldo e estoque não mudam.
3. Recarregue `/mercado` e acesse `/painel`.
4. **Esperado:** estado persistido; "Estoque total" no painel reflete a quantidade armazenada.
5. Acesse `/mercado` como `professor@euriptus.com`.
6. **Esperado:** visão informativa do professor (sem catálogo/compras da empresa).

### 17. Negociações — proposta, recusa e cancelamento

1. Faça login como `produtor@euriptus.com`, compre itens no `/mercado` e acesse `/negociacoes`.
2. Envie uma proposta para outra empresa (ex.: Logística) com item, quantidade, valor e mensagem opcional.
3. **Esperado:** proposta criada como `Pendente`, listada em enviadas/recebidas com autor e dados.
4. Acesse como destinatário e recuse a proposta.
5. **Esperado:** status `Recusada`, autoria do respondente registrada, sem alteração de saldo/estoque.
6. Envie nova proposta e cancele como empresa de origem.
7. **Esperado:** status `Cancelada`; destinatário não pode cancelar e origem não pode aceitar/recusar (autorização validada).

### 18. Negociações — aceite com transferência e validações

1. Com estoque no vendedor e saldo suficiente no comprador, envie proposta e aceite como destinatário.
2. **Esperado:** status `Aceita`; estoque e saldo transferidos entre empresas; extratos registram
   `DESPESA` (comprador) e `RECEITA` (vendedor) da negociação com o respondente como autor.
3. Tente aceitar proposta quando o comprador não tem saldo suficiente ou o vendedor não tem estoque
   suficiente no momento do aceite.
4. **Esperado:** erro informativo, sem transferências parciais; proposta permanece/estado consistente.
5. Acesse `/negociacoes` como `professor@euriptus.com`.
6. **Esperado:** visão informativa do professor (sem ações de negociação).

### 19. Rodadas — abertura, fechamento e processamento

1. Faça login como `professor@euriptus.com` e acesse `/professor/rodadas`.
2. Clique em **Abrir rodada**.
3. **Esperado:** rodada 1 criada como `Aberta`, com autor/horário; indicador "Rodada atual" no painel dos alunos passa a exibir 1 (aberta).
4. Com a rodada aberta, realize operações (ex.: compra no mercado ou aceite de negociação).
5. **Esperado:** transações dessas operações ficam vinculadas à rodada aberta (`rodadaId`).
6. Clique em **Fechar e processar rodada**.
7. **Esperado:** rodada marcada como `Fechada`; por empresa são aplicados custos fixos ativos, salário mínimo e imposto sobre receitas da rodada (quando houver), com lançamentos vinculados à rodada e autoria do professor; empréstimos ativos podem ser quitados automaticamente se houver saldo suficiente. Não deve ser possível manter/abrir outra rodada simultaneamente.

### 20. Painel do professor — gestão e visão consolidada

1. Faça login como `professor@euriptus.com` e acesse `/professor`.
2. **Esperado:** atalhos para Rodadas, Eventos, Empresas, Usuários, Parâmetros, Catálogo, Notícias, Financeiro e Banco.
3. Acesse `/professor/empresas`, crie/edite uma empresa e abra **Detalhes**.
4. **Esperado:** detalhe consolidado com saldo, dívida/investimentos ativos, usuários, estoque, empréstimos/investimentos, propostas/negociações e transações recentes.
5. Acesse `/professor/usuarios`, crie um estudante vinculado a uma empresa e (opcionalmente) redefina senha de um usuário existente.
6. **Esperado:** validações de perfil/vínculo aplicadas; e-mail duplicado tratado com erro claro.
7. Acesse `/professor/parametros` e `/professor/catalogo` e realize alterações.
8. **Esperado:** parâmetros/catálogo atualizados e refletidos nas telas que os utilizam.
9. Acesse `/professor/banco`.
10. **Esperado:** visão consolidada por empresa de saldos, dívidas e investimentos ativos, com link para detalhes.

### 21. Eventos econômicos — templates e disparo

1. Acesse `/professor/eventos`.
2. **Esperado:** tela com criação/edição de templates, lista e histórico de eventos disparados.
3. Crie um template ativo (tipo, título, descrição e impacto opcional) e clique em **Disparar**.
4. **Esperado:** toast de sucesso, registro em "Eventos disparados" com data, autor e (se houver) rodada atual; notícia correspondente publicada/visível em `/painel` e `/professor/noticias`.
5. Desative um template.
6. **Esperado:** botão de disparo indisponível para template inativo; edição/remoção funcionam conforme esperado.
7. Acesse `/professor/eventos` como estudante.
8. **Esperado:** acesso bloqueado/redirecionado pelo guard de professor.

### 22. Banco — parcelas, quitação e resgate antecipado

1. Entre como `produtor@euriptus.com`, abra `/banco` e contrate R$ 1.200,00 em 3 parcelas.
2. **Esperado:** 3 parcelas listadas com vencimentos mensais e valor por parcela; total devido
   reflete juros de 3 meses.
3. Pague a parcela 1.
4. **Esperado:** parcela marcada como paga, autor registrado e lançamento em `/historico`.
5. Use **Quitar com desconto** no contrato restante.
6. **Esperado:** quitação com 5% de desconto, saldo debitado pelo valor com desconto e contrato
   marcado como quitado.
7. Aplique R$ 500,00 e resgate imediatamente, na mesma rodada aberta.
8. **Esperado:** resgate sem rendimento e com 5% de taxa; a simulação anterior mostra o mesmo
   valor. Após fechar e abrir outra rodada, o resgate de nova aplicação deve render a taxa gravada.

### 23. Mercado — produção, capacidade e melhorias

1. Como professor, abra uma rodada. Como produtor, acesse `/mercado`.
2. **Esperado:** capacidade `0/100`, produto **Café em grãos** disponível e 100 unidades livres.
3. Registre produção de 30 sacas.
4. **Esperado:** capacidade `30/100`; estoque do produto com valor contábil; alerta de produção
   aparece em `/historico` e `/estoque`.
5. Compre **Ampliação de área** (+30 un./mês).
6. **Esperado:** capacidade total sobe para 130 e o saldo é debitado com feedback persistente.
7. Tente produzir acima do disponível.
8. **Esperado:** botão bloqueado/erro informativo, sem alteração de estoque ou capacidade.

### 24. Estoque, histórico e alertas

1. Entre como `logistica@euriptus.com` e abra `/estoque`.
2. **Esperado:** quantidade, preço médio e valor total por item; seção de produção da rodada.
3. Abra `/historico`.
4. **Esperado:** linha do tempo com transações e produção, incluindo rodada `MM/AAAA`, quantidade
   e autor de cada registro.
5. Abra `/alertas` e observe o sino no header.
6. **Esperado:** alertas coerentes com o estado (sem rodada, saldo baixo, parcelas vencidas,
   propostas pendentes, capacidade esgotada e/ou sem produto em estoque); o contador do sino
   acompanha a quantidade e o ícone leva à central.

### 25. Catálogo categorizado e negociação com marketing

1. Como professor, abra `/professor/catalogo` e crie uma melhoria com categoria **Melhoria**,
   aumento de capacidade e aumento de marketing `0,10`.
2. **Esperado:** item aparece no Mercado da etapa correta com os efeitos descritos.
3. Como venda, aceite uma proposta de café embalado com essa melhoria aplicada.
4. **Esperado:** saldo creditado da vendedora é 10% maior que o valor pago pelo comprador;
   transações de compra e venda usam os respectivos valores; estoque e `/historico` refletem a
   transferência com autor e rodada.

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

   > **Importante:** ao colar os valores na Vercel, **não inclua as aspas** que aparecem no
   > `.env` local. Valores como `"postgresql://..."` ou `"https://..."` são inválidos fora de
   > um arquivo `.env` e causam erro genérico de login. O valor deve começar diretamente em
   > `postgresql://` ou `https://`.

4. Build command: `npm run build` (já inclui `prisma generate`). O `postinstall` também
   gera o client.
5. Faça o deploy.
6. Teste login, logout, `/painel` e `/professor` com as contas reais.
7. Após validar, desative o seed em produção e troque quaisquer senhas de demonstração.

**Preview deployments:** `NEXTAUTH_URL` precisa corresponder à URL de cada ambiente. Para
múltiplos previews, configure a variável por ambiente na Vercel.

### 4. Erros comuns na Vercel

| Sintoma | Causa provável | Correção |
| ------- | -------------- | -------- |
| `500 MIDDLEWARE_INVOCATION_FAILED` | `NEXTAUTH_SECRET` ausente/inválido no ambiente Production; o middleware `withAuth` falha ao ler o JWT. | Configure `NEXTAUTH_SECRET` para **Production**, sem aspas, e faça redeploy. |
| “Não foi possível entrar agora. Tente novamente em instantes.” | Erro de configuração do NextAuth/CSRF/banco, não credenciais inválidas. | Confira `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL` (pooled) e `DIRECT_URL` (direta), sem aspas. |
| “E-mail ou senha inválidos.” | Usuário/senha incorretos ou seed não aplicado no banco usado pelo deploy. | Confira as credenciais e se o seed foi rodado contra o mesmo Neon. |

> Ao colar valores na Vercel, **nunca inclua as aspas** presentes no `.env`. Use
> `vercel env ls` para conferir nomes/ambientes sem revelar valores.

**Estado atual (iteração 11):** `npm test` e `npm run build` passam localmente; as 11 migrations
foram aplicadas no Neon e o seed foi reexecutado com os novos parâmetros/catálogo. Após merge das
alterações, faça redeploy na Vercel para publicar as novas rotas e regras.

---

## Próximas iterações

O plano de 10 etapas foi concluído e a iteração 11 adicionou financiamento parcelado, produção
mensal, capacidade/melhorias, estoque avaliado, histórico e alertas (com contratos preservados).

**Possíveis evoluções futuras (opcionais):**
- Google OAuth e fluxos avançados de autenticação/conta (recuperação, convites, rate limiting).
- Testes automatizados mais amplos (integração/E2E com banco e fluxos completos).
- Efeitos econômicos automáticos mais ricos para eventos e regras de equilíbrio.
- Transformação automática entre etapas com consumo de insumos e cálculo de custo de produção.
- Relatórios, gráficos, ranking, exportação e melhorias adicionais de UX/acessibilidade.

---

## Limitações conhecidas

- Não há troca nem recuperação de senha nesta iteração.
- Não há rate limiting no login (recomendado antes de expor a aplicação publicamente).
- Mudanças de papel/empresa feitas diretamente no banco exigem novo login para o JWT
  refletir; as páginas continuam seguras porque revalidam no servidor.
- Eventos econômicos suportam templates pré-registrados e disparo pelo professor com registro de
  autoria/rodada e geração automática de notícia. Efeitos econômicos automáticos complexos sobre
  saldos, estoques ou preços (além do registro/disparo/notícia) não são aplicados automaticamente;
  quando necessário, o professor ajusta parâmetros ou catálogo manualmente. As demais notícias
  continuam sendo conteúdo editorial/administrativo.
- No painel, **Rodada atual** reflete a rodada aberta (ou a última fechada); **Dívida total** e
  **Estoque total** refletem dados reais.
- Compras do mercado usam catálogo de preço fixo por etapa, debitam saldo e geram estoque/
  despesa com valor médio ponderado. A produção mensal é manual (registrada pelo estudante)
  e limitada pela capacidade; não há transformação automática entre etapas nem consumo de
  insumos. Negociações ocorrem por propostas formais (oferta → aceite) com transferência de
  itens/dinheiro, sem reserva na criação, sem devolução e sem chat.
- O processamento de rodada aplica custos fixos, salário mínimo, imposto sobre receitas da
  rodada e paga parcelas vencidas no mês quando há saldo. Débitos automáticos podem deixar
  saldo negativo; investimentos não rendem passivamente por rodada — o rendimento só é
  realizado no resgate manual.
- Resgate na mesma competência da aplicação não rende e cobra 5% de taxa; em competência
  posterior rende a taxa gravada no contrato. Não há juros compostos nem capitalização automática.
- O limite de empréstimo (3× saldo atual) não considera dívidas existentes; é a regra
  literal do produto. A quitação antecipada concede 5% de desconto sobre o saldo devedor.
- O resultado do Financeiro é operacional (receitas − despesas − impostos − salários);
  movimentos de banco e compras aparecem no extrato, mas o cálculo do resumo permanece operacional.
- O extrato e o saldo não são derivados um do outro nesta versão: os lançamentos do seed
  são históricos e o saldo inicial já representa o caixa após eles.
- Cobertura automatizada atual é básica (smoke tests de regras/utilitários/schemas + `lint`/`typecheck`/`build`); não há suíte E2E nem testes de integração com banco. Fluxos principais seguem validados por testes manuais e auditoria Lighthouse.
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
- Ações de jogo existentes (empréstimo, aplicação, resgate, compra, propostas/negociações)
  registram autoria; futuras ações também deverão registrar `userId`.

---

## Uso educacional

Projeto privado, sem fins comerciais. Nenhum dinheiro real é movimentado. Os dados de
demonstração são fictícios.
