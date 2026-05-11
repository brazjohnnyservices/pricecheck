import { useEffect, useState } from 'react'
import { fetchResearchDetail, type DetailItem, type ResearchSummary } from '@/hooks/useHistory'
import DiffPill from './DiffPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import { gerarPDF } from '@/lib/pdf'

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

interface Props {
  research: ResearchSummary
  onClose: () => void
  onDelete: (id: number) => Promise<{ error: string | null }>
}

export default function ResearchDetailModal({ research, onClose, onDelete }: Props) {
  const [items, setItems] = useState<DetailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setLoading(true)
    fetchResearchDetail(research.id).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [research.id])

  function handlePDF() {
    gerarPDF(
      research.client_nome,
      research.data_pesquisa,
      items.map((item) => ({
        codigo: item.product_codigo,
        descricao: item.product_descricao,
        categoria: item.product_categoria,
        venda: item.venda_sugerida,
        concorrentes: [
          { nome: item.conc1_nome, preco: item.conc1_preco },
          { nome: item.conc2_nome, preco: item.conc2_preco },
          { nome: item.conc3_nome, preco: item.conc3_preco },
        ].filter((c) => c.nome || c.preco !== null),
      }))
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-lg text-primary">{research.client_nome}</h3>
            {research.client_razao && research.client_razao !== research.client_nome && (
              <p className="text-xs text-gray-400">{research.client_razao}</p>
            )}
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(research.data_pesquisa)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePDF}
              disabled={loading || items.length === 0}
              className="text-sm border border-accent text-accent px-3 py-1.5 rounded-md hover:bg-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Gerar PDF
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={async () => {
                    setDeleting(true)
                    await onDelete(research.id)
                    setDeleting(false)
                  }}
                  disabled={deleting}
                  className="text-sm bg-danger text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? 'Excluindo…' : 'Confirmar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-gray-400 hover:text-danger transition-colors px-2 py-1.5"
                title="Excluir pesquisa"
              >
                Excluir
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none pl-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sem itens registrados.</p>
          ) : (
            items.map((item) => <DetailCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}

function DetailCard({ item }: { item: DetailItem }) {
  const precos = [item.conc1_preco, item.conc2_preco, item.conc3_preco].filter(
    (p): p is number => p !== null && p > 0
  )
  const menorPreco = precos.length > 0 ? Math.min(...precos) : null
  const mediaPreco =
    precos.length > 0 ? precos.reduce((a, b) => a + b, 0) / precos.length : null
  const venda = item.venda_sugerida ?? 0

  const concorrentes = [
    { nome: item.conc1_nome, preco: item.conc1_preco },
    { nome: item.conc2_nome, preco: item.conc2_preco },
    { nome: item.conc3_nome, preco: item.conc3_preco },
  ]

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">#{item.product_codigo}</span>
        {item.product_categoria && (
          <span
            className="text-xs text-white font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: CATEGORIA_COLORS[item.product_categoria] ?? '#6B7280' }}
          >
            {item.product_categoria}
          </span>
        )}
        <p className="w-full text-sm font-medium text-primary">{item.product_descricao}</p>
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-xs text-gray-400">Custo</p>
          <p className="font-medium">{item.custo ? formatCurrency(item.custo) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-accent">Venda sugerida</p>
          <p className="font-medium text-accent">{venda ? formatCurrency(venda) : '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {concorrentes.map((c, i) => (
          <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 truncate">{c.nome || `Conc. ${i + 1}`}</p>
            <p className="text-sm font-medium">{c.preco ? formatCurrency(c.preco) : '—'}</p>
          </div>
        ))}
      </div>

      {(menorPreco !== null || mediaPreco !== null) && (
        <div className="flex gap-2 flex-wrap pt-1 border-t border-gray-100">
          <DiffPill label="vs menor" venda={venda} concorrente={menorPreco} />
          <DiffPill label="vs média" venda={venda} concorrente={mediaPreco} />
        </div>
      )}
    </div>
  )
}
