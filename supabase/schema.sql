-- ============================================================
-- PriceCheck — Schema principal
-- Cole este arquivo no editor SQL do seu projeto Supabase
-- ============================================================

-- Clientes (importados via XLSX)
create table if not exists clients (
  id             bigserial primary key,
  codigo         int unique not null,
  razao_social   text not null,
  nome_fantasia  text,
  endereco       text,
  numero         text,
  bairro         text,
  cidade         text,
  uf             text,
  telefone       text,
  created_at     timestamptz default now()
);

create index if not exists clients_cidade_idx       on clients (cidade);
create index if not exists clients_bairro_idx       on clients (bairro);
create index if not exists clients_nome_fantasia_idx on clients (nome_fantasia);

-- Produtos (importados via XLSX)
create table if not exists products (
  id               bigserial primary key,
  codigo           int unique not null,
  descricao        text not null,
  categoria        text,
  custo_padrao     numeric(10,2),
  pct_investimento numeric(5,2) default 0,
  is_principal     boolean default false,
  created_at       timestamptz default now()
);

create index if not exists products_categoria_idx   on products (categoria);
create index if not exists products_principal_idx   on products (is_principal);

-- Pesquisas de preço (uma por visita a cliente)
create table if not exists researches (
  id             bigserial primary key,
  client_id      bigint references clients(id) on delete cascade,
  data_pesquisa  date default current_date,
  observacoes    text,
  created_at     timestamptz default now()
);

create index if not exists researches_client_idx on researches (client_id);
create index if not exists researches_data_idx   on researches (data_pesquisa);

-- Itens da pesquisa
create table if not exists research_items (
  id              bigserial primary key,
  research_id     bigint references researches(id) on delete cascade,
  product_id      bigint references products(id),
  custo           numeric(10,2),
  venda_sugerida  numeric(10,2),
  conc1_nome      text,
  conc1_preco     numeric(10,2),
  conc2_nome      text,
  conc2_preco     numeric(10,2),
  conc3_nome      text,
  conc3_preco     numeric(10,2),
  created_at      timestamptz default now()
);

create index if not exists research_items_research_idx on research_items (research_id);
create index if not exists research_items_product_idx  on research_items (product_id);

-- ============================================================
-- Row Level Security — DESABILITADO (1 usuário, sem multi-tenant)
-- Auth simples via Supabase Auth impede acesso público.
-- ============================================================
alter table clients        disable row level security;
alter table products       disable row level security;
alter table researches     disable row level security;
alter table research_items disable row level security;
