import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface ResearchSummary {
  id: number
  data_pesquisa: string
  observacoes: string | null
  client_id: number
  client_nome: string
  client_razao: string
}

export interface DetailItem {
  id: number
  product_id: number
  product_codigo: number
  product_descricao: string
  product_categoria: string | null
  custo: number | null
  venda_sugerida: number | null
  conc1_nome: string | null
  conc1_preco: number | null
  conc2_nome: string | null
  conc2_preco: number | null
  conc3_nome: string | null
  conc3_preco: number | null
}

export function useHistory() {
  const [allResearches, setAllResearches] = useState<ResearchSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  useEffect(() => {
    supabase
      .from('researches')
      .select('id, data_pesquisa, observacoes, client_id, clients(nome_fantasia, razao_social)')
      .order('data_pesquisa', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAllResearches(
            (data as any[]).map((r) => ({
              id: r.id,
              data_pesquisa: r.data_pesquisa,
              observacoes: r.observacoes,
              client_id: r.client_id,
              client_nome: r.clients?.nome_fantasia || r.clients?.razao_social || '—',
              client_razao: r.clients?.razao_social || '',
            }))
          )
        }
        setLoading(false)
      })
  }, [])

  const researches = allResearches.filter((r) => {
    const q = clientFilter.toLowerCase()
    const matchClient = q
      ? r.client_nome.toLowerCase().includes(q) || r.client_razao.toLowerCase().includes(q)
      : true
    const matchMonth = monthFilter ? r.data_pesquisa.startsWith(monthFilter) : true
    return matchClient && matchMonth
  })

  // Grouped by client (ordem: cliente com pesquisa mais recente primeiro)
  const groups = researches.reduce<Map<number, { clientNome: string; items: ResearchSummary[] }>>(
    (acc, r) => {
      if (!acc.has(r.client_id)) acc.set(r.client_id, { clientNome: r.client_nome, items: [] })
      acc.get(r.client_id)!.items.push(r)
      return acc
    },
    new Map()
  )

  async function deleteResearch(id: number): Promise<{ error: string | null }> {
    const { error } = await supabase.from('researches').delete().eq('id', id)
    if (error) return { error: error.message }
    setAllResearches((prev) => prev.filter((r) => r.id !== id))
    return { error: null }
  }

  return { groups, researches, loading, clientFilter, setClientFilter, monthFilter, setMonthFilter, deleteResearch }
}

export async function fetchResearchDetail(researchId: number): Promise<DetailItem[]> {
  const { data } = await supabase
    .from('research_items')
    .select('*, products(id, codigo, descricao, categoria)')
    .eq('research_id', researchId)

  if (!data) return []

  return (data as any[]).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_codigo: item.products?.codigo ?? 0,
    product_descricao: item.products?.descricao ?? '—',
    product_categoria: item.products?.categoria ?? null,
    custo: item.custo,
    venda_sugerida: item.venda_sugerida,
    conc1_nome: item.conc1_nome,
    conc1_preco: item.conc1_preco,
    conc2_nome: item.conc2_nome,
    conc2_preco: item.conc2_preco,
    conc3_nome: item.conc3_nome,
    conc3_preco: item.conc3_preco,
  }))
}
