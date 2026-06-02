import { useMemo, useState } from 'react'
import { useClients } from '@/hooks/useClients'
import { useProducts } from '@/hooks/useProducts'
import ClientList from '@/components/ClientList'
import ClientFormModal from '@/components/ClientFormModal'
import { formatCurrency } from '@/lib/utils'
import type { Client } from '@/types/db'

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const CATEGORIA_COLORS: Record<string, string> = {
  'Azeitonas': '#1D4ED8', 'Champignon': '#065F46', 'Macarrão Inst.': '#92400E',
  'Amendoim': '#6D28D9', 'Canjica': '#B91C1C', 'Pipoca': '#7C3AED',
  'Tapioca': '#374151', 'Coco Ralado': '#0369A1', 'Catchup': '#B45309',
  'Mostarda': '#4D7C0F', 'Farofa': '#9A3412', 'Farinha de Milho': '#A16207',
  'Trigo Kibe': '#854D0E', 'Uva Passa': '#831843', 'Tempero Fácil': '#0F766E',
}

const DIAS_NOVO = 30

export default function ClientsPage() {
  const [tab, setTab] = useState<'clientes' | 'produtos'>('clientes')

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <TabBtn active={tab === 'clientes'} onClick={() => setTab('clientes')}>Clientes</TabBtn>
        <TabBtn active={tab === 'produtos'} onClick={() => setTab('produtos')}>Produtos</TabBtn>
      </div>

      {tab === 'clientes' ? <ClientesTab /> : <ProdutosTab />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
        active ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

/* ── Aba Clientes ──────────────────────────────────────────────── */
function ClientesTab() {
  const { clients, loading, error, addClient, deleteClient } = useClients()
  const [busca, setBusca] = useState('')
  const [openCities, setOpenCities] = useState<Set<string>>(new Set(['__novos__']))
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [view, setView] = useState<'lista' | 'cards'>('lista')
  const [showForm, setShowForm] = useState(false)

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - DIAS_NOVO)
    return d.toISOString()
  }, [])

  const novos = useMemo(
    () => clients.filter((c) => c.created_at >= cutoff),
    [clients, cutoff]
  )

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.nome_fantasia?.toLowerCase().includes(q) ||
        c.razao_social.toLowerCase().includes(q) ||
        c.bairro?.toLowerCase().includes(q) ||
        c.cidade?.toLowerCase().includes(q) ||
        String(c.codigo).includes(q)
    )
  }, [clients, busca])

  const grouped = useMemo(() => {
    const map = new Map<string, Client[]>()
    for (const c of filtrados) {
      const key = c.cidade?.trim() || 'Sem cidade'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
  }, [filtrados])

  const isOpen = (key: string) => busca.trim() !== '' || openCities.has(key)

  function toggleCity(key: string) {
    setOpenCities((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const numCidades = new Set(clients.map(c => c.cidade?.trim() || 'Sem cidade')).size

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Clientes</h2>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {clients.length} clientes · {numCidades} cidades
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Alternância lista/cards */}
          <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setView('lista')}
              title="Visualização em lista"
              className={`p-1.5 rounded-md transition-all ${view === 'lista' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </button>
            <button
              onClick={() => setView('cards')}
              title="Visualização em cards"
              className={`p-1.5 rounded-md transition-all ${view === 'cards' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Novo cliente
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome, bairro, cidade ou código…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder-gray-400"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        )}
      </div>

      {busca && !loading && (
        <p className="text-sm text-gray-500 -mt-2">
          {filtrados.length === 0 ? 'Nenhum resultado' : `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} em ${grouped.length} cidade${grouped.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {error && <p className="text-sm text-danger">Erro ao carregar clientes: {error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <p className="text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : view === 'lista' ? (
        /* ── Vista Lista ── */
        <div className="space-y-2">
          {/* Grupo Novos Clientes */}
          {!busca && novos.length > 0 && (
            <div className={`rounded-xl border transition-all duration-150 overflow-hidden ${isOpen('__novos__') ? 'border-emerald-200 shadow-sm' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => toggleCity('__novos__')}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${isOpen('__novos__') ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">✨</span>
                  <span className={`text-sm font-semibold ${isOpen('__novos__') ? 'text-emerald-700' : 'text-primary'}`}>
                    Novos clientes
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOpen('__novos__') ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {novos.length}
                  </span>
                  <span className="text-xs text-gray-400">últimos {DIAS_NOVO} dias</span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen('__novos__') ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </button>
              {isOpen('__novos__') && (
                <div className="px-4 pb-4 pt-3 bg-emerald-50/30 border-t border-emerald-100">
                  <ClientList clients={novos} onDelete={deleteClient} />
                </div>
              )}
            </div>
          )}

          {/* Grupos por cidade */}
          {grouped.map(([cidade, cidadeClients]) => {
            const open = isOpen(cidade)
            return (
              <div key={cidade} className={`rounded-xl border transition-all duration-150 overflow-hidden ${open ? 'border-accent/20 shadow-sm' : 'border-gray-200 bg-white'}`}>
                <button
                  onClick={() => toggleCity(cidade)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${open ? 'bg-accent/5' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className={`w-4 h-4 shrink-0 transition-colors ${open ? 'text-accent' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className={`text-sm font-semibold transition-colors ${open ? 'text-accent' : 'text-primary'}`}>
                      {toTitleCase(cidade)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${open ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'}`}>
                      {cidadeClients.length}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-3 bg-gray-50/40 border-t border-accent/10">
                    <ClientList clients={cidadeClients} onDelete={deleteClient} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Vista Cards ── */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {grouped.map(([cidade, cidadeClients]) => {
              const active = selectedCity === cidade
              return (
                <button
                  key={cidade}
                  onClick={() => setSelectedCity(active ? null : cidade)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-150 ${
                    active
                      ? 'border-accent bg-accent text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                  <svg className={`w-5 h-5 mb-2 ${active ? 'text-white/70' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-primary'}`}>
                    {toTitleCase(cidade)}
                  </p>
                  <p className={`text-xs mt-1 ${active ? 'text-white/70' : 'text-gray-400'}`}>
                    {cidadeClients.length} cliente{cidadeClients.length !== 1 ? 's' : ''}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Painel expandido da cidade selecionada */}
          {selectedCity && (() => {
            const cidadeClients = grouped.find(([c]) => c === selectedCity)?.[1] ?? []
            return (
              <div className="border border-accent/20 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-accent/5 border-b border-accent/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-accent">{toTitleCase(selectedCity)}</span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{cidadeClients.length}</span>
                  </div>
                  <button onClick={() => setSelectedCity(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>
                <div className="px-4 pb-4 pt-3 bg-gray-50/40">
                  <ClientList clients={cidadeClients} onDelete={deleteClient} />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {showForm && <ClientFormModal onSave={addClient} onClose={() => setShowForm(false)} />}
    </div>
  )
}

/* ── Aba Produtos ──────────────────────────────────────────────── */
function ProdutosTab() {
  const { products, loading } = useProducts()
  const [busca, setBusca] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [soPrincipais, setSoPrincipais] = useState(false)

  const categorias = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria).filter(Boolean))).sort() as string[],
    [products]
  )

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return products.filter((p) => {
      const matchQ = !q || p.descricao.toLowerCase().includes(q) || String(p.codigo).includes(q)
      const matchCat = !catFilter || p.categoria === catFilter
      const matchPrincipal = !soPrincipais || p.is_principal
      return matchQ && matchCat && matchPrincipal
    })
  }, [products, busca, catFilter, soPrincipais])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-primary">Produtos</h2>
        {!loading && <p className="text-sm text-gray-400">{filtrados.length} de {products.length}</p>}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por descrição ou código…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-400"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white shadow-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors">
          <input type="checkbox" checked={soPrincipais} onChange={(e) => setSoPrincipais(e.target.checked)} className="accent-accent" />
          Só principais
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nenhum produto encontrado.</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 w-20">Código</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Descrição</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Categoria</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right w-28 hidden sm:table-cell">Custo</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right w-28">Venda sug.</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-center w-10">★</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((p) => {
                const venda = p.custo_padrao ? parseFloat((p.custo_padrao * 1.4).toFixed(2)) : null
                return (
                  <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.codigo}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium text-xs leading-tight">{p.descricao}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.categoria ? (
                        <span className="text-xs text-white font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: CATEGORIA_COLORS[p.categoria] ?? '#6B7280' }}>
                          {p.categoria}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs hidden sm:table-cell">
                      {p.custo_padrao ? formatCurrency(p.custo_padrao) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-accent font-semibold text-xs">
                      {venda ? formatCurrency(venda) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.is_principal ? <span className="text-accent text-xs">★</span> : <span className="text-gray-200 text-xs">☆</span>}
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
