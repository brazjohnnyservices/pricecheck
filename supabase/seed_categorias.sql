-- ============================================================
-- PriceCheck — Seed de categorias
--
-- Decisão de design: categorias como CHECK constraint na tabela
-- products, sem tabela separada.
--
-- Justificativa: a lista é fixa (15 itens definidos no CLAUDE.md),
-- nunca precisará de CRUD próprio, e manter como constraint evita
-- um JOIN extra e simplifica a importação via XLSX.
-- ============================================================

-- Adiciona CHECK constraint de categorias válidas
alter table products
  add constraint if not exists products_categoria_check
  check (
    categoria is null or categoria in (
      'Azeitonas',
      'Champignon',
      'Macarrão Inst.',
      'Amendoim',
      'Canjica',
      'Pipoca',
      'Tapioca',
      'Coco Ralado',
      'Catchup',
      'Mostarda',
      'Farofa',
      'Farinha de Milho',
      'Trigo Kibe',
      'Uva Passa',
      'Tempero Fácil'
    )
  );

-- ============================================================
-- Para referência: lista completa de categorias e suas cores
-- (usadas no frontend — não precisam de tabela)
-- ============================================================
-- Azeitonas      → #1D4ED8
-- Champignon     → #065F46
-- Macarrão Inst. → #92400E
-- Amendoim       → #6D28D9
-- Canjica        → #B91C1C
-- Pipoca         → #7C3AED
-- Tapioca        → #374151
-- Coco Ralado    → #0369A1
-- Catchup        → #B45309
-- Mostarda       → #4D7C0F
-- Farofa         → #9A3412
-- Farinha de Milho → #A16207
-- Trigo Kibe     → #854D0E
-- Uva Passa      → #831843
-- Tempero Fácil  → #0F766E
