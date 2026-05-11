import ConcorrenteBox from './ConcorrenteBox'
import DiffPill from './DiffPill'
import type { LocalItem } from '@/hooks/useResearch'
import { calcVendaSugerida } from '@/lib/utils'

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
  item: LocalItem
  onUpdate: (patch: Partial<LocalItem>) => void
  onRemove: () => void
}

function parsePreco(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) || n <= 0 ? null : n
}

export default function ProductCard({ item, onUpdate, onRemove }: Props) {
  const { product, custo, venda_sugerida, concorrentes } = item

  const precos = concorrentes.map((c) => parsePreco(c.preco)).filter((p): p is number => p !== null)
  const menorPreco = precos.length > 0 ? Math.min(...precos) : null
  const mediaPreco = precos.length > 0 ? precos.reduce((a, b) => a + b, 0) / precos.length : null

  function handleCusto(e: React.ChangeEvent<HTMLInputElement>) {
    const novoCusto = parseFloat(e.target.value) || 0
    onUpdate({ custo: novoCusto, venda_sugerida: calcVendaSugerida(novoCusto) })
  }

  function handleVenda(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ venda_sugerida: parseFloat(e.target.value) || 0 })
  }

  function updateConc(idx: number, field: 'nome' | 'preco', value: string) {
    const next = concorrentes.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    onUpdate({ concorrentes: next })
  }

  function addConc() {
    onUpdate({ concorrentes: [...concorrentes, { nome: '', preco: '' }] })
  }

  function removeConc(idx: number) {
    onUpdate({ concorrentes: concorrentes.filter((_, i) => i !== idx) })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">#{product.codigo}</span>
            {product.categoria && (
              <span
                className="text-xs text-white font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: CATEGORIA_COLORS[product.categoria] ?? '#6B7280' }}
              >
                {product.categoria}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-primary leading-tight">{product.descricao}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-danger transition-colors shrink-0 text-lg leading-none"
          aria-label="Remover"
        >
          ×
        </button>
      </div>

      {/* Custo + Venda sugerida */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Custo (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={custo || ''}
            onChange={handleCusto}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-accent font-medium">Venda sugerida (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={venda_sugerida || ''}
            onChange={handleVenda}
            className="w-full border border-accent rounded px-2 py-1.5 text-sm text-accent font-medium focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Concorrentes */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {concorrentes.map((c, idx) => (
            <ConcorrenteBox
              key={idx}
              label={`Conc. ${idx + 1}`}
              nome={c.nome}
              preco={c.preco}
              onNome={(v) => updateConc(idx, 'nome', v)}
              onPreco={(v) => updateConc(idx, 'preco', v)}
              onRemove={concorrentes.length > 1 ? () => removeConc(idx) : undefined}
            />
          ))}
        </div>
        <button
          onClick={addConc}
          className="text-xs text-gray-400 hover:text-accent border border-dashed border-gray-200 hover:border-accent rounded px-3 py-1.5 transition-colors"
        >
          + concorrente
        </button>
      </div>

      {/* Comparativo */}
      {(menorPreco !== null || mediaPreco !== null) && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
          <DiffPill label="vs menor" venda={venda_sugerida} concorrente={menorPreco} />
          <DiffPill label="vs média" venda={venda_sugerida} concorrente={mediaPreco} />
        </div>
      )}
    </div>
  )
}
