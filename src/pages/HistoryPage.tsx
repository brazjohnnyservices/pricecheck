import { useState } from 'react'
import { useHistory, type ResearchSummary } from '@/hooks/useHistory'
import { formatDate } from '@/lib/utils'
import ResearchDetailModal from '@/components/ResearchDetailModal'

export default function HistoryPage() {
  const { groups, researches, loading, clientFilter, setClientFilter, monthFilter, setMonthFilter, deleteResearch } =
    useHistory()
  const [selected, setSelected] = useState<ResearchSummary | null>(null)

  const hasFilter = clientFilter.trim() !== '' || monthFilter !== ''

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h2 className="text-2xl font-semibold text-primary">Histórico de pesquisas</h2>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Filtrar por cliente…"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent flex-1 min-w-[180px]"
        />
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {hasFilter && (
          <button
            onClick={() => {
              setClientFilter('')
              setMonthFilter('')
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : researches.length === 0 ? (
        <p className="text-sm text-gray-400">
          {hasFilter
            ? 'Nenhuma pesquisa encontrada para esse filtro.'
            : 'Nenhuma pesquisa registrada ainda.'}
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([clientId, { clientNome, items }]) => (
            <section key={clientId}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                {clientNome}
              </h3>
              <div className="space-y-2">
                {items.map((r) => (
                  <ResearchRow key={r.id} research={r} onClick={() => setSelected(r)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <ResearchDetailModal
          research={selected}
          onClose={() => setSelected(null)}
          onDelete={async (id) => {
            const { error } = await deleteResearch(id)
            if (!error) setSelected(null)
            return { error }
          }}
        />
      )}
    </div>
  )
}

function ResearchRow({ research, onClick }: { research: ResearchSummary; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-accent/40 hover:shadow-sm transition-all flex items-center justify-between gap-4"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-primary">{formatDate(research.data_pesquisa)}</p>
        {research.observacoes && (
          <p className="text-xs text-gray-400 truncate max-w-xs">{research.observacoes}</p>
        )}
      </div>
      <span className="text-gray-300 text-xl leading-none">›</span>
    </button>
  )
}
