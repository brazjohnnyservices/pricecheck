import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Client, Product } from '@/types/db'
import { calcVendaSugerida } from '@/lib/utils'

export interface Concorrente {
  nome: string
  preco: string
}

export interface LocalItem {
  product: Product
  custo: number
  venda_sugerida: number
  concorrentes: Concorrente[]
}

function toLocalItem(product: Product): LocalItem {
  const custo = product.custo_padrao ?? 0
  return {
    product,
    custo,
    venda_sugerida: calcVendaSugerida(custo),
    concorrentes: [
      { nome: '', preco: '' },
      { nome: '', preco: '' },
      { nome: '', preco: '' },
    ],
  }
}

function parsePrecoDB(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return isFinite(n) && n > 0 ? n : null
}

export function useResearch(clientId: string | undefined) {
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<LocalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('products').select('*').eq('is_principal', true).order('descricao'),
    ]).then(([clientRes, productsRes]) => {
      if (clientRes.data) setClient(clientRes.data)
      if (productsRes.data) setItems(productsRes.data.map(toLocalItem))
      setLoading(false)
    })
  }, [clientId])

  function updateItem(productId: number, patch: Partial<LocalItem>) {
    setItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, ...patch } : it))
    )
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((it) => it.product.id !== productId))
  }

  function addProduct(product: Product) {
    if (items.some((it) => it.product.id === product.id)) return
    setItems((prev) => [...prev, toLocalItem(product)])
  }

  async function saveResearch(): Promise<{ error: string | null }> {
    if (!client) return { error: 'Cliente não encontrado.' }
    if (items.length === 0) return { error: 'Adicione ao menos um produto antes de salvar.' }

    setSaving(true)

    const today = new Date().toISOString().split('T')[0]

    const { data: research, error: resErr } = await supabase
      .from('researches')
      .insert({ client_id: client.id, data_pesquisa: today })
      .select('id')
      .single()

    if (resErr || !research) {
      setSaving(false)
      return { error: resErr?.message ?? 'Erro ao criar pesquisa.' }
    }

    // Salva os 3 primeiros concorrentes nas colunas fixas do banco
    const rows = items.map((it) => {
      const concs = it.concorrentes
      return {
        research_id: research.id,
        product_id: it.product.id,
        custo: it.custo > 0 ? it.custo : null,
        venda_sugerida: it.venda_sugerida > 0 ? it.venda_sugerida : null,
        conc1_nome: concs[0]?.nome || null,
        conc1_preco: parsePrecoDB(concs[0]?.preco ?? ''),
        conc2_nome: concs[1]?.nome || null,
        conc2_preco: parsePrecoDB(concs[1]?.preco ?? ''),
        conc3_nome: concs[2]?.nome || null,
        conc3_preco: parsePrecoDB(concs[2]?.preco ?? ''),
      }
    })

    const { error: itemsErr } = await supabase.from('research_items').insert(rows)

    setSaving(false)
    if (itemsErr) return { error: itemsErr.message }
    return { error: null }
  }

  return { client, items, loading, saving, updateItem, removeItem, addProduct, saveResearch }
}
