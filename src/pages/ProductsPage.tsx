import { useMemo, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { formatCurrency } from '@/lib/utils'

const CATEGORIA_COLORS: Record<string, string> = {
  'Azeitonas': '#1D4ED8',
  'Champignon': '#065F46',
  'Macarrão Inst.': '#92400E',
  'Amendoim': '#6D28D9',
  'Canjica': '#B91C1C',
  'Pipoca': '#7C3AED',
  'Tapioca': '#374151',
  'Coco Ralado': '#0369A1',
  'Catchup': '#B45309',
  'Mostarda': '#4D7C0F',
  'Farofa': '#9A3412',
  'Farinha de Milho': '#A16207',
  'Trigo Kibe': '#854D0E',
  'Uva Passa': '#831843',
  'Tempero Fácil': '#0F766E',
}

export default function ProductsPage() {
  const { products, loading } = useProducts()
  const [busca, setBusca] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sooPrincipais, setSoPrincipais] = useState(false)

  const categorias = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria).filter(Boolean))).sort(),
    [products]
  )

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return products.filter((p) => {
      const matchQ = !q || p.descricao.toLowerCase().includes(q) || String(p.codigo).includes(q)
      const matchCat = !catFilter || p.categoria === catFilter
      const matchPrincipal = !sooPrincipais || p.is_principal
      return matchQ && matchCat && matchPrincipal
    })
  }, [products, busca, catFilter, sooPrincipais])

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-primary">Produtos</h2>
          <span className="text-sm text-gray-400">
            {loading ? '…' : `${filtrados.length} de ${products.length}`}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por descrição ou código…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sooPrincipais}
            onChange={(e) => setSoPrincipais(e.target.checked)}
            className="accent-accent"
          />
          Só principais
        </label>
      </div>

      {/* Tabela */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando produtos…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nenhum produto encontrado.</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 w-20">Código</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Descrição</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Categoria</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right w-28">Custo</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right w-28">Venda sug.</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-center w-20">Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((p) => {
                const venda = p.custo_padrao ? parseFloat((p.custo_padrao * 1.4).toFixed(2)) : null
                return (
                  <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.codigo}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{p.descricao}</td>
                    <td className="px-4 py-3">
                      {p.categoria ? (
                        <span
                          className="text-xs text-white font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: CATEGORIA_COLORS[p.categoria] ?? '#6B7280' }}
                        >
                          {p.categoria}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {p.custo_padrao ? formatCurrency(p.custo_padrao) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-accent font-medium">
                      {venda ? formatCurrency(venda) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.is_principal ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-success" title="Principal" />
                      ) : (
                        <span className="text-gray-200">·</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
