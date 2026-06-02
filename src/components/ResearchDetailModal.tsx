import { useEffect, useState } from 'react'
import { fetchResearchDetail, type DetailItem, type ResearchSummary } from '@/hooks/useHistory'
import { supabaseAdmin } from '@/lib/supabase'
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

interface EditRow {
  id: number
  custo: string
  venda_sugerida: string
  conc1_nome: string
  conc1_preco: string
  conc2_nome: string
  conc2_preco: string
  conc3_nome: string
  conc3_preco: string
}

function itemToEditRow(item: DetailItem): EditRow {
  return {
    id: item.id,
    custo: item.custo != null ? String(item.custo) : '',
    venda_sugerida: item.venda_sugerida != null ? String(item.venda_sugerida) : '',
    conc1_nome: item.conc1_nome ?? '',
    conc1_preco: item.conc1_preco != null ? String(item.conc1_preco) : '',
    conc2_nome: item.conc2_nome ?? '',
    conc2_preco: item.conc2_preco != null ? String(item.conc2_preco) : '',
    conc3_nome: item.conc3_nome ?? '',
    conc3_preco: item.conc3_preco != null ? String(item.conc3_preco) : '',
  }
}

function toNum(val: string): number | null {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? null : n
}

export default function ResearchDetailModal({ research, onClose, onDelete }: Props) {
  const [items, setItems] = useState<DetailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editRows, setEditRows] = useState<EditRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') editMode ? cancelEdit() : onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editMode])

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

  function startEdit() {
    setEditRows(items.map(itemToEditRow))
    setEditMode(true)
    setSaveError(null)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditRows([])
    setSaveError(null)
  }

  function updateRow(id: number, field: keyof EditRow, value: string) {
    setEditRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  async function saveEdits() {
    setSaving(true)
    setSaveError(null)
    for (const row of editRows) {
      const { error } = await supabaseAdmin.from('research_items').update({
        custo: toNum(row.custo),
        venda_sugerida: toNum(row.venda_sugerida),
        conc1_nome: row.conc1_nome || null,
        conc1_preco: toNum(row.conc1_preco),
        conc2_nome: row.conc2_nome || null,
        conc2_preco: toNum(row.conc2_preco),
        conc3_nome: row.conc3_nome || null,
        conc3_preco: toNum(row.conc3_preco),
      }).eq('id', row.id)
      if (error) {
        setSaveError('Erro ao salvar: ' + error.message)
        setSaving(false)
        return
      }
    }
    // Update local items state with saved values
    setItems((prev) =>
      prev.map((item) => {
        const row = editRows.find((r) => r.id === item.id)
        if (!row) return item
        return {
          ...item,
          custo: toNum(row.custo),
          venda_sugerida: toNum(row.venda_sugerida),
          conc1_nome: row.conc1_nome || null,
          conc1_preco: toNum(row.conc1_preco),
          conc2_nome: row.conc2_nome || null,
          conc2_preco: toNum(row.conc2_preco),
          conc3_nome: row.conc3_nome || null,
          conc3_preco: toNum(row.conc3_preco),
        }
      })
    )
    setSaving(false)
    setEditMode(false)
    setEditRows([])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && !editMode && onClose()}
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
            {editMode ? (
              <>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="text-sm bg-accent text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePDF}
                  disabled={loading || items.length === 0}
                  className="text-sm border border-accent text-accent px-3 py-1.5 rounded-md hover:bg-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Gerar PDF
                </button>
                <button
                  onClick={startEdit}
                  disabled={loading || items.length === 0}
                  className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Editar
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
              </>
            )}
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-danger px-5 pt-3">{saveError}</p>
        )}

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sem itens registrados.</p>
          ) : editMode ? (
            editRows.map((row) => {
              const item = items.find((i) => i.id === row.id)!
              return (
                <EditableCard
                  key={row.id}
                  item={item}
                  row={row}
                  onChange={(field, value) => updateRow(row.id, field, value)}
                />
              )
            })
          ) : (
            items.map((item) => <DetailCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Read-only card ───────────────────────────────────────────── */
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

/* ── Editable card ────────────────────────────────────────────── */
function EditableCard({
  item,
  row,
  onChange,
}: {
  item: DetailItem
  row: EditRow
  onChange: (field: keyof EditRow, value: string) => void
}) {
  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="border border-accent/30 rounded-xl p-4 space-y-3 bg-blue-50/20">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Custo</label>
          <input
            type="text"
            inputMode="decimal"
            value={row.custo}
            onChange={(e) => onChange('custo', e.target.value)}
            className={inputCls}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-accent">Venda sugerida</label>
          <input
            type="text"
            inputMode="decimal"
            value={row.venda_sugerida}
            onChange={(e) => onChange('venda_sugerida', e.target.value)}
            className={inputCls + ' border-accent/40 text-accent font-medium'}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['1', '2', '3'] as const).map((n) => {
          const nomeKey = `conc${n}_nome` as keyof EditRow
          const precoKey = `conc${n}_preco` as keyof EditRow
          return (
            <div key={n} className="space-y-1">
              <input
                type="text"
                value={row[nomeKey]}
                onChange={(e) => onChange(nomeKey, e.target.value)}
                className={inputCls}
                placeholder={`Conc. ${n}`}
              />
              <input
                type="text"
                inputMode="decimal"
                value={row[precoKey]}
                onChange={(e) => onChange(precoKey, e.target.value)}
                className={inputCls}
                placeholder="0.00"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
