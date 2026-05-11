# CLAUDE.md — PriceCheck

> Sistema interno de pesquisa de preço no PDV, organizado por cliente. Compara o preço sugerido de venda com até 3 concorrentes.

---

## Contexto do produto

**Nome:** PriceCheck
**Usuário único:** representante comercial RC (regiões SP)
**Objetivo:** Em cada visita a cliente, o RC vai consultar o custo do produto, calcular a venda sugerida com margem padrão e registrar até 4 preços de concorrentes no PDV. Histórico por cliente para acompanhar evolução.

**Não é um SaaS multi-tenant.** É uma ferramenta pessoal hospedada online (PC + celular). Auth simples (1 usuário), sem cobrança, sem onboarding.

---

## Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui
- **Banco:** Supabase (Postgres + Auth)
- **Hospedagem:** Netlify
- **PDF:** jsPDF + jsPDF-autotable
- **Excel import:** SheetJS (xlsx) — para importar tabelas iniciais
- **Estado:** React Context + hooks (não usar Redux)
- **IDE:** Claude Code no VS Code

---

## Identidade visual

- **Primary:** `#1E2A38` (navy)
- **Accent:** `#1D4ED8` (blue 700)
- **Background:** `#F5F7FA`
- **Success:** `#22C55E`
- **Danger:** `#EF4444`
- **Warning:** `#F59E0B`
- **Fonts:** DM Sans (body) + DM Serif Display (headings)
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
-- Clientes (importados via XLSX)
-- Campos removidos em 2026-05-10: cnpj, cep, data_cadastro
create table clients (
  id bigserial primary key,
  codigo int unique not null,             -- Código do cliente
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

-- Produtos (importados via XLSX)
create table products (
  id bigserial primary key,
  codigo int unique not null,             -- Código do produto
  descricao text not null,
  categoria text,                         -- ver lista acima
  custo_padrao numeric(10,2),             -- custo padrão geral
  pct_investimento numeric(5,2) default 0, -- ex 0.15 para 15%
  is_principal boolean default false,     -- aparece pré-preenchido na pesquisa
  created_at timestamptz default now()
);
create index on products (categoria);
create index on products (is_principal);

-- Pesquisas de preço (uma por visita a cliente)
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
create table research_items (
  id bigserial primary key,
  research_id bigint references researches(id) on delete cascade,
  product_id bigint references products(id),
  custo numeric(10,2),                    -- pode ajustar do padrão
  venda_sugerida numeric(10,2),           -- custo * 1.40 default
  conc1_nome text, conc1_preco numeric(10,2),
  conc2_nome text, conc2_preco numeric(10,2),
  conc3_nome text, conc3_preco numeric(10,2),
  created_at timestamptz default now()
);
create index on research_items (research_id);
create index on research_items (product_id);
```

**RLS:** desabilitado (1 usuário, sem multi-tenant). Apenas autenticação para impedir acesso público.

---

## Regras de negócio

1. **Venda sugerida = custo × 1.40** (margem 40%). Editável pelo usuário.
2. **Custo padrão** vem da tabela `products.custo_padrao`. Em cada item pode ser ajustado sem afetar o padrão.
3. **Produtos principais** (`is_principal = true`) vêm pré-preenchidos ao abrir um cliente. Outros podem ser adicionados manualmente.
4. **Concorrentes:** sempre 3 slots fixos (nome + preço). Vazios ficam vazios.
5. **Histórico:** todas as pesquisas ficam salvas. Útil para ver evolução do preço do mesmo concorrente ao longo do tempo no mesmo cliente.
6. **Comparativo:** sempre mostrar diferença % entre venda sugerida e (a) menor preço concorrente, (b) média dos concorrentes.

---

## Estrutura de pastas

```
pricecheck/
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── ClientCard.tsx
│   │   ├── ClientList.tsx
│   │   ├── ProductCard.tsx    # card individual de produto na pesquisa
│   │   ├── ConcorrenteBox.tsx # bloco de 1 concorrente
│   │   ├── DiffPill.tsx       # pill verde/vermelho de comparação
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ClientsPage.tsx    # lista todos os clientes
│   │   ├── ResearchPage.tsx   # tela de pesquisa (após selecionar cliente)
│   │   ├── HistoryPage.tsx    # histórico de todas pesquisas
│   │   └── ImportPage.tsx     # /admin import inicial via XLSX
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── pdf.ts             # geração de relatório
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useClients.ts
│   │   ├── useProducts.ts
│   │   └── useResearch.ts
│   ├── types/
│   │   └── db.ts              # tipos do schema
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.local                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── package.json
```

---

## Telas

### 1. Login
Email + senha (Supabase Auth). 1 conta apenas.

### 2. Clientes (`/`)
Lista de clientes em cards (responsiva). Busca por nome, razão social, bairro ou CNPJ.
Card mostra: Nome Fantasia, Razão Social, Bairro. Click → vai pra `/pesquisa/:clientId`.

### 3. Pesquisa (`/pesquisa/:clientId`)
Header com nome do cliente + botão "trocar cliente".
Métricas no topo: Produtos / Preenchidos / Sua venda ganha / Concorrente ganha.
Lista de produtos em cards. Cada card:
- Código + nome + badge da categoria
- Custo (input, vem preenchido do padrão)
- Venda sugerida (input azul, calculado mas editável)
- 3 boxes de concorrente (nome + preço PDV)
- Linha final com comparativo vs menor e vs média
- Botão X pra remover produto da pesquisa
Botão "Adicionar produto" abre modal com lista filtrável.
Botão "Salvar pesquisa" → persiste e volta pra lista de clientes.
Botão "Gerar PDF" → relatório imprimível.

### 4. Histórico (`/historico`)
Lista de pesquisas anteriores, agrupadas por cliente.
Click numa pesquisa → modal/drawer com detalhes.
Filtros: por cliente, por data, por categoria.

### 5. Importação (`/admin`)
Upload de XLSX para popular clientes ou produtos. Pré-visualização antes de inserir.

---

## Mobile

- Layout responsivo (mobile-first).
- Em telas pequenas, cards de produto empilhados verticalmente.
- Concorrentes 1 por linha no celular, 3 por linha no PC.
- Botões grandes, inputs grandes (touch friendly).
- Tabela some no mobile, vira card list.

---

## Regras pro Claude Code

1. **Sempre cole o contexto base antes de cada task** (este CLAUDE.md).
2. **Implemente uma task de cada vez.** Não avance sem confirmação.
3. **Não altere rotas ou DB fora do escopo da task.**
4. **Liste arquivos antes de modificar** ("Vou tocar em: A, B, C").
5. **Toast/loading em toda operação assíncrona.**
6. **Datas sempre em pt-BR.**
7. **Não instale dependências sem perguntar.**
8. **Sem testes automatizados nesta fase** (uso pessoal, valida em produção).
9. **Componentes pequenos e isolados** (1 arquivo = 1 responsabilidade).
10. **TypeScript estrito.** Tipos do banco em `types/db.ts`.

---

## Roadmap inicial (tasks numeradas)

- [ ] **T01** — Setup do projeto (Vite + TS + Tailwind + shadcn + Supabase client)
- [ ] **T02** — Schema do banco (rodar SQL acima no Supabase)
- [ ] **T03** — Importação de clientes via XLSX (`/admin`)
- [ ] **T04** — Importação de produtos via XLSX (`/admin`)
- [ ] **T05** — Marcar produtos principais (interface simples no admin)
- [ ] **T06** — Login + proteção de rotas
- [ ] **T07** — Página de Clientes (lista + busca)
- [ ] **T08** — Página de Pesquisa (cliente → produtos principais pré-carregados)
- [ ] **T09** — Adicionar produto (modal de busca)
- [ ] **T10** — Salvar pesquisa no banco
- [ ] **T11** — Página de Histórico
- [ ] **T12** — Relatório PDF
- [ ] **T13** — Deploy Netlify
- [ ] **T14** — PWA (opcional, pra usar offline em campo)

---

## Decisões já tomadas (não revisitar)

- Custo geral + ajuste por item (não custo por cliente)
- 3 concorrentes fixos (não 4)
- Margem padrão 40% sobre custo (`custo × 1.40`)
- Produtos principais pré-preenchidos
- Histórico completo (todas as pesquisas)
- 1 usuário, sem multi-tenant
- Sem ofertas/% de investimento na tela principal (já está no custo)