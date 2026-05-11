# PriceCheck

> Pesquisa de preço de campo, sem planilha.

Ferramenta interna para representante comercial registrar e comparar preços de produtos no PDV, com até 3 concorrentes por produto.

## Tecnologias

- React 18 + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth)
- Hospedagem: Netlify

## Como rodar em desenvolvimento

1. Clone o repositório
2. Copie `.env.local` e preencha as variáveis do Supabase:
   ```
   VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:5173`

## Deploy (Netlify)

1. Conecte o repositório no Netlify
2. Configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
3. Build command: `npm run build`
4. Publish directory: `dist`

## Banco de dados

Execute `supabase/schema.sql` no editor SQL do seu projeto Supabase antes do primeiro uso.
