# STATUS.md — PriceCheck

> Arquivo de acompanhamento do projeto. Não alterar CLAUDE.md (instruções do agente).

---

## Progresso das Tasks

| Task | Status | Descrição |
|------|--------|-----------|
| T01 | ✅ Feito | Setup: Vite + React 18 + TS + Tailwind v4 + shadcn/ui + Supabase client + React Router v6 + fontes DM Sans / DM Serif |
| T02 | ✅ Feito | Schema do banco: `clients`, `products`, `researches`, `research_items` + indexes + RLS desabilitado |
| T02b | ✅ Feito | Seeds gerados: `seed_clientes.sql` (133 clientes) + `seed_produtos.sql` (691 produtos) |
| T03 | ✅ Feito | Admin → Importar Clientes: upload XLSX, preview 5 linhas, upsert em lotes de 100 |
| T04 | ✅ Feito | Admin → Importar Produtos: upload XLSX, preview, upsert |
| T05 | ✅ Feito | Admin → Categorias e Destaque: tabela com busca, dropdown categoria (auto-save), checkbox principal (auto-save) |
| T06 | ✅ Feito | Login (email + senha via Supabase Auth) + proteção de rotas + Layout com nav (Histórico / Admin / Sair) |
| T07 | ✅ Feito | Página de Clientes: grid responsivo com busca por nome, bairro, cidade ou código |
| T08 | ✅ Feito | Página de Pesquisa: carrega produtos principais, cards com custo / venda sugerida / 3 concorrentes / DiffPill |
| T09 | ✅ Feito | Modal "Adicionar produto" com busca filtrável (ProductSearchModal.tsx + useProducts.ts) |
| T10 | ✅ Feito | Salvar pesquisa no banco (`researches` + `research_items`) + Toast + redirect |
| T11 | ✅ Feito | Página de Histórico: agrupada por cliente, filtro por nome e mês, modal de detalhe |
| T12 | ✅ Feito | Relatório PDF (jsPDF + jspdf-autotable): landscape A4, tabela com custo/venda/conc/diffs. Botão em ResearchPage e no detalhe do histórico |
| T13 | ✅ Feito | Deploy Netlify: `netlify.toml` com build config + SPA redirect + Node 20 |
| T14 | ✅ Feito | PWA: vite-plugin-pwa, manifest, service worker autoUpdate, ícone SVG em `public/icon.svg` |

---

## Arquivos implementados

```
src/
├── contexts/
│   └── AuthContext.tsx          ← sessão Supabase Auth, useAuth hook
├── pages/
│   ├── Login.tsx                ← form email+senha
│   ├── ClientsPage.tsx          ← lista de clientes com busca
│   ├── ResearchPage.tsx         ← pesquisa de preço por cliente + PDF
│   ├── HistoryPage.tsx          ← histórico agrupado por cliente + filtros
│   └── ImportPage.tsx           ← /admin (clientes + produtos + configurar)
├── components/
│   ├── Layout.tsx               ← header com nav + logout
│   ├── ClientCard.tsx           ← card clicável de cliente
│   ├── ClientList.tsx           ← grid responsivo de cards
│   ├── ProductCard.tsx          ← card de produto na pesquisa
│   ├── ConcorrenteBox.tsx       ← bloco nome + preço por concorrente
│   ├── DiffPill.tsx             ← pill % vs menor / vs média
│   ├── ProductSearchModal.tsx   ← modal de busca para adicionar produto
│   ├── ResearchDetailModal.tsx  ← modal de detalhe de pesquisa histórica + PDF
│   └── Toast.tsx                ← toast auto-dismiss (3s)
├── hooks/
│   ├── useClients.ts            ← busca todos os clientes
│   ├── useResearch.ts           ← estado local + saveResearch()
│   ├── useProducts.ts           ← busca todos os produtos
│   └── useHistory.ts            ← histórico de pesquisas + fetchResearchDetail()
├── lib/
│   ├── supabase.ts              ← supabase (anon, só auth) + supabaseAdmin (service key, dados)
│   ├── utils.ts                 ← cn, formatCurrency, formatDate, calcVendaSugerida, calcDiffPercent
│   └── pdf.ts                   ← gerarPDF() — landscape A4, jsPDF + jspdf-autotable
└── types/
    └── db.ts                    ← Categoria, Client, Product, Research, ResearchItem + NewXxx

public/
└── icon.svg                     ← ícone PWA (navy com texto PriceCheck)

netlify.toml                     ← build config + SPA redirect
vite.config.ts                   ← Vite + Tailwind + PWA (vite-plugin-pwa)
```

---

## Decisões e fixes importantes

### Supabase — dois clientes
- `supabase` (anon key) → **só para auth** (`signInWithPassword`, `onAuthStateChange`, `getSession`)
- `supabaseAdmin` (service key) → **todos os dados** (reads e writes)
- Motivo: projeto Supabase bloqueia leitura e escrita com a anon key; service key bypassa RLS
- `supabaseAdmin` criado com `auth: { persistSession: false, autoRefreshToken: false }` para evitar warning de múltiplas instâncias GoTrueClient

### Grants SQL necessários (rodar se criar nova tabela)
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
```

### Tailwind v4
- Configuração via CSS (`@theme` em `src/index.css`), sem `tailwind.config.ts`
- Plugin `@tailwindcss/vite` no `vite.config.ts`

### TypeScript — Supabase
- `createClient<any>()` nos dois clientes para evitar erro de tipo `RejectExcessProperties<Update, Row>` que resolve para `never` no Supabase v2.105

### Campos removidos de `clients`
- `cnpj`, `cep`, `data_cadastro` — removidos em 2025-05-10, não existem no schema

### PWA — ícones
- Usando SVG (`public/icon.svg`) com `sizes: "any"` — funciona em Chrome/Edge/Firefox modernos
- Para iOS Safari: adicionar PNG 192x192 e 512x512 em `public/icons/` se necessário

---

## Próximos passos para deploy

1. **Netlify**: conectar repositório, definir variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (e `VITE_SUPABASE_SERVICE_KEY` se usado no build — mas como é client-side, já está no `.env.local`)
2. **Testar PWA**: após deploy, verificar se aparece botão "Instalar" no browser
3. **Opcional**: criar PNG icons 192x192 e 512x512 para suporte iOS
