# CLAUDE.md — PriceCheck

> Sistema interno de pesquisa de preço no PDV, organizado por cliente. Compara o preço sugerido de venda com N concorrentes (dinâmico).

---

## Repositório e deploy

- **GitHub:** https://github.com/brazjohnnyservices/pricecheck.git
- **Branch principal:** `main`
- **Hospedagem:** Vercel (conectado ao GitHub, deploy automático no push)
  - Migrado do Netlify em 2026-06-02 (Netlify atingiu limite de builds do free tier)
- **Variáveis de ambiente no Vercel:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_SERVICE_KEY`

---

## Contexto do produto

**Nome:** PriceCheck
**Usuário único:** representante comercial RC (regiões SP)
**Objetivo:** Em cada visita a cliente, o RC consulta o custo do produto, calcula a venda sugerida com margem padrão e registra os preços dos concorrentes no PDV. Histórico por cliente para acompanhar evolução ao longo do tempo.

**Não é um SaaS multi-tenant.** Ferramenta pessoal hospedada online (PC + celular). Auth simples (1 usuário), sem cobrança, sem onboarding.

---

## Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Estilo:** Tailwind CSS v4 (config via `@theme` em CSS, sem `tailwind.config.ts`) + shadcn/ui (Radix)
- **Banco:** Supabase (Postgres + Auth)
- **Hospedagem:** Vercel
- **PDF:** jsPDF + jsPDF-autotable
- **Excel import:** SheetJS (xlsx)
- **Estado:** React Context + hooks (sem Redux)
- **PWA:** vite-plugin-pwa (service worker skipWaiting + clientsClaim, ícone SVG)
- **IDE:** Claude Code no VS Code

---

## Identidade visual

- **Primary:** `#1E2A38` (navy)
- **Accent:** `#1D4ED8` (blue 700)
- **Background:** `#F5F7FA`
- **Success:** `#22C55E`
- **Danger:** `#EF4444`
- **Warning:** `#F59E0B`
- **Fonts:** Inter (única fonte — corpo e títulos). Sora foi removida.
- **Slogan:** "Pesquisa de preço de campo, sem planilha."

Paleta de categorias:
| Categoria | Cor |
|---|---|
| Azeitonas | `#1D4ED8` |
| Champignon | `#065F46` |
| Macarrão Inst. | `#92400E` |
| Amendoim | `#6D28D9` |
| Canjica | `#B91C1C` |
| Pipoca | `#7C3AED` |
| Tapioca | `#374151` |
| Coco Ralado | `#0369A1` |
| Catchup | `#B45309` |
| Mostarda | `#4D7C0F` |
| Farofa | `#9A3412` |
| Farinha de Milho | `#A16207` |
| Trigo Kibe | `#854D0E` |
| Uva Passa | `#831843` |
| Tempero Fácil | `#0F766E` |

---

## Modelo de dados (Supabase)

```sql
-- Clientes
-- Campos removidos em 2026-05-10: cnpj, cep, data_cadastro
create table clients (
  id bigserial primary key,
  codigo int unique not null,
  razao_social text not null,
  nome_fantasia text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  telefone text,
  created_at timestamptz default now()
);
create index on clients (cidade);
create index on clients (bairro);
create index on clients (nome_fantasia);

-- Produtos
create table products (
  id bigserial primary key,
  codigo int unique not null,
  descricao text not null,
  categoria text,
  custo_padrao numeric(10,2),
  pct_investimento numeric(5,2) default 0,
  is_principal boolean default false,
  created_at timestamptz default now()
);
create index on products (categoria);
create index on products (is_principal);

-- Pesquisas de preço
create table researches (
  id bigserial primary key,
  client_id bigint references clients(id) on delete cascade,
  data_pesquisa date default current_date,
  observacoes text,
  created_at timestamptz default now()
);
create index on researches (client_id);
create index on researches (data_pesquisa);

-- Itens da pesquisa
-- Nota: UI permite N concorrentes dinâmicos, banco salva os 3 primeiros
-- Migration futura para salvar todos: ALTER TABLE research_items ADD COLUMN concorrentes jsonb DEFAULT '[]';
create table research_items (
  id bigserial primary key,
  research_id bigint references researches(id) on delete cascade,
  product_id bigint references products(id),
  custo numeric(10,2),
  venda_sugerida numeric(10,2),
  conc1_nome text, conc1_preco numeric(10,2),
  conc2_nome text, conc2_preco numeric(10,2),
  conc3_nome text, conc3_preco numeric(10,2),
  created_at timestamptz default now()
);
create index on research_items (research_id);
create index on research_items (product_id);
```

**Grants necessários** (rodar sempre que criar nova tabela):
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
```

**RLS:** desabilitado (1 usuário). Autenticação via Supabase Auth para bloquear acesso público.

---

## Arquitetura Supabase — dois clientes

```ts
// src/lib/supabase.ts
supabase      // anon key → SOMENTE auth (signIn, signOut, onAuthStateChange)
supabaseAdmin // service key → TODOS os dados (reads e writes)
```

Motivo: RLS desabilitado mas a anon key ainda bloqueia em algumas configs. Service key bypassa tudo.
`supabaseAdmin` usa `createClient<any>()` (evita erro de tipos do Supabase v2.105) e `auth: { persistSession: false, autoRefreshToken: false }` (evita warning GoTrueClient duplo).

---

## Regras de negócio

1. **Venda sugerida = custo × 1.40** (margem 40%). Editável pelo usuário.
2. **Custo padrão** vem de `products.custo_padrao`. Por item pode ser ajustado sem afetar o padrão global.
3. **Produtos principais** (`is_principal = true`) vêm pré-preenchidos ao abrir um cliente. Outros são adicionados via modal de busca (multi-seleção, modal fica aberto).
4. **Concorrentes:** dinâmicos por produto (começa com 3 slots, botão "+ concorrente" adiciona mais). O banco persiste os 3 primeiros; UI trabalha com array local sem limite.
5. **Histórico:** todas as pesquisas ficam salvas com cascade delete (apagar cliente apaga pesquisas; apagar pesquisa apaga itens).
6. **Comparativo:** DiffPill mostra % vs menor e % vs média dos concorrentes.
7. **PDF:** landscape A4, colunas dinâmicas por concorrente, célula mais barata da linha destacada em verde.
8. **Novos Clientes:** clientes com `created_at >= '2026-06-02T00:00:00.000Z'` (corte pós-importação inicial) OU adicionados na sessão atual via `newlyAddedIds` em `useClients`.

---

## Estrutura de pastas

```
pricecheck/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          ← sessão Supabase Auth, useAuth hook
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ClientsPage.tsx          ← home: abas Clientes/Produtos
│   │   ├── ProductsPage.tsx         ← /produtos (rota standalone, conteúdo tb na home)
│   │   ├── ResearchPage.tsx         ← pesquisa ativa + PDF + salvar
│   │   ├── HistoryPage.tsx          ← histórico agrupado por cliente + excluir
│   │   └── ImportPage.tsx           ← /admin: importar XLSX + configurar produtos
│   ├── components/
│   │   ├── Layout.tsx               ← header nav (Início · Histórico · Admin · Sair) + logout
│   │   ├── ClientCard.tsx           ← card com exclusão inline (2 cliques)
│   │   ├── ClientList.tsx           ← grid responsivo de cards
│   │   ├── ClientFormModal.tsx      ← modal de cadastro de novo cliente
│   │   ├── ProductCard.tsx          ← card editável: custo/venda/concorrentes dinâmicos
│   │   ├── ConcorrenteBox.tsx       ← bloco nome+preço com remoção opcional
│   │   ├── DiffPill.tsx             ← pill % vs menor / vs média
│   │   ├── ProductSearchModal.tsx   ← modal multi-add de produtos (não fecha ao adicionar)
│   │   ├── ResearchDetailModal.tsx  ← detalhe de pesquisa histórica + edição inline + PDF + excluir
│   │   └── Toast.tsx                ← toast auto-dismiss 3s
│   ├── hooks/
│   │   ├── useClients.ts            ← lista + addClient + deleteClient + newlyAddedIds
│   │   ├── useProducts.ts           ← lista todos os produtos
│   │   ├── useResearch.ts           ← estado local da pesquisa + saveResearch
│   │   └── useHistory.ts            ← histórico + fetchResearchDetail + deleteResearch
│   ├── lib/
│   │   ├── supabase.ts              ← supabase (anon) + supabaseAdmin (service key)
│   │   ├── pdf.ts                   ← gerarPDF(clientNome, data, PdfItem[])
│   │   └── utils.ts                 ← cn, formatCurrency, formatDate, calcVendaSugerida, calcDiffPercent
│   ├── types/
│   │   └── db.ts                    ← Client, Product, Research, ResearchItem + NewXxx
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── icon.svg                     ← ícone PWA
├── supabase/
│   ├── schema.sql
│   ├── seed_clientes.sql            ← 133 clientes
│   └── seed_produtos.sql            ← 691 produtos
├── uploads/                         ← XLSXs originais (não versionados no prod)
├── vercel.json                      ← SPA redirect + no-cache para sw.js
├── netlify.toml                     ← mantido como fallback (build + SPA redirect + Node 20)
├── vite.config.ts                   ← Vite + Tailwind + PWA (skipWaiting + clientsClaim)
├── .env.local                       ← NÃO commitado (gitignore)
└── package.json
```

---

## Telas implementadas

### 1. Login (`/login`)
Email + senha via Supabase Auth. Redireciona para `/` se já logado.

### 2. Home — Clientes (`/` — aba Clientes)
- Grade de cards de cidades (4 por linha, Title Case), clicar abre painel com os clientes
- Card especial **Novos clientes** (verde) — aparece quando há clientes adicionados desde 2026-06-02 ou na sessão
- Busca por nome, razão social, bairro, cidade ou código
- Botão "+ Novo cliente" → modal com formulário completo
- Card de cliente com botão × → confirmação inline → exclusão (cascade)

### 2b. Home — Produtos (`/` — aba Produtos)
- Tabela de todos os produtos com busca, filtro por categoria e "Só principais"
- Colunas: código, descrição, badge de categoria colorido, custo, venda sugerida, ★ principal

### 3. Pesquisa (`/pesquisa/:clientId`)
- Header: nome do cliente + "← Trocar cliente"
- Métricas: Produtos / Preenchidos / Venda ganha / Conc. ganha
- Cards de produto: custo (editável) / venda sugerida (editável, azul) / concorrentes dinâmicos / DiffPill
- "+ concorrente" em cada card adiciona slots ilimitados
- "Adicionar produto": modal com busca, multi-add (não fecha), botão Concluir
- "Gerar PDF": relatório da sessão atual
- "Salvar pesquisa": persiste no banco + toast + redirect

### 4. Histórico (`/historico`)
- Filtros: busca por cliente + picker de mês
- Lista agrupada por cliente (ordem: pesquisa mais recente primeiro)
- Row → modal de detalhe: produtos, preços, concorrentes, DiffPill
- Modal: botão **Editar** → edição inline de custo, venda e concorrentes por item → **Salvar alterações**
- Modal: botão "Gerar PDF" + "Excluir" (2 cliques com confirmação)

### 5. Importação (`/admin`)
- Aba Clientes: upload XLSX → preview 5 linhas → upsert em lotes de 100
- Aba Produtos: upload XLSX → preview → upsert
- Aba Configurar: tabela de produtos com busca, dropdown categoria (auto-save), checkbox principal (auto-save)

---

## Relatório PDF

- Orientação landscape A4
- Colunas: Produto | Venda Sug. | Conc. 1 … Conc. N (dinâmico) | vs Menor | vs Média
- Custo **não** aparece no PDF
- Célula com o menor preço da linha (qualquer coluna) → fundo verde + texto verde negrito
- Footer com data de geração e número de página

---

## Mobile

- Layout responsivo mobile-first
- Cards de produto empilhados verticalmente no celular
- Concorrentes: 1 por linha no celular, até 3 por linha no PC (grid-cols-1 sm:grid-cols-3)
- Inputs e botões com área de toque generosa

---

## Fixes críticos aplicados

- **`formatDate`:** strings `"YYYY-MM-DD"` são parsadas como data local (não UTC) para evitar mostrar o dia anterior no fuso UTC-3
- **Dois clientes Supabase:** `supabase` (anon, só auth) e `supabaseAdmin` (service key, todos os dados)
- **`createClient<any>()`** nos dois clientes evita erro `RejectExcessProperties never` no Supabase v2.105
- **Grants SQL:** rodar sempre que criar nova tabela nova
- **SW `skipWaiting + clientsClaim`:** deploys ativam imediatamente sem esperar fechar abas
- **No-cache para `sw.js`** em `vercel.json` e `netlify.toml`

---

## Regras pro Claude Code

1. **Implemente sem pedir confirmação** (usuário liberou fluxo contínuo).
2. **Não altere rotas ou DB fora do escopo da task.**
3. **Toast/loading em toda operação assíncrona.**
4. **Datas sempre em pt-BR** (`formatDate` em `utils.ts`).
5. **Não instale dependências sem avisar.**
6. **Sem testes automatizados nesta fase.**
7. **Componentes pequenos e isolados** (1 arquivo = 1 responsabilidade).
8. **TypeScript estrito.** Tipos do banco em `types/db.ts`. Usar `createClient<any>()` no Supabase.
9. **Sempre usar `supabaseAdmin`** para leitura e escrita de dados (nunca `supabase` anon para dados).
10. **Após implementar, rodar `npx tsc --noEmit`** para confirmar zero erros de tipo.
11. **Commitar e fazer push** ao final de cada conjunto de mudanças significativas.

---

## Decisões já tomadas (não revisitar)

- Custo geral + ajuste por item (não custo por cliente)
- Concorrentes dinâmicos na UI; banco salva os 3 primeiros em colunas fixas
- Margem padrão 40% (`custo × 1.40`)
- Produtos principais pré-preenchidos
- Histórico completo com cascade delete
- 1 usuário, sem multi-tenant, RLS desabilitado
- Custo não aparece no PDF (só venda sugerida)
- Grade de cards por cidade na home (não accordion nem sidebar)
- Modal de produto não fecha ao adicionar (multi-add)
- Fonte única Inter (Sora removida em 2026-06-02)
- Hospedagem Vercel (Netlify descartado por limite de builds)
