import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useResearch } from '@/hooks/useResearch'
import type { LocalItem } from '@/hooks/useResearch'
import ProductCard from '@/components/ProductCard'
import ProductSearchModal from '@/components/ProductSearchModal'
import Toast from '@/components/Toast'
import { gerarPDF } from '@/lib/pdf'

function parsePreco(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) || n <= 0 ? null : n
}

function localToPdfItem(item: LocalItem) {
  return {
    codigo: item.product.codigo,
    descricao: item.product.descricao,
    categoria: item.product.categoria,
    venda: item.venda_sugerida > 0 ? item.venda_sugerida : null,
    concorrentes: item.concorrentes.map((c) => ({
      nome: c.nome || null,
      preco: parsePreco(c.preco),
    })),
  }
}

export default function ResearchPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { client, items, loading, saving, updateItem, removeItem, addProduct, saveResearch } =
    useResearch(clientId)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const addedIds = new Set(items.map((it) => it.product.id))

  // Métricas
  const preenchidos = items.filter((it) =>
    it.concorrentes.some((c) => parsePreco(c.preco) !== null)
  )

  const ganhos = preenchidos.filter((it) => {
    const precos = it.concorrentes
      .map((c) => parsePreco(c.preco))
      .filter((p): p is number => p !== null)
    const menor = Math.min(...precos)
    return it.venda_sugerida <= menor
  })

  const perdidos = preenchidos.length - ganhos.length

  async function handleSave() {
    const { error } = await saveResearch()
    if (error) {
      setToast({ message: error, type: 'error' })
    } else {
      setToast({ message: 'Pesquisa salva com sucesso!', type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    }
  }

  function handlePDF() {
    if (!client) return
    const dataPesquisa = new Date().toISOString().split('T')[0]
    gerarPDF(
      client.nome_fantasia || client.razao_social,
      dataPesquisa,
      items.map(localToPdfItem)
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {loading ? (
            <p className="text-sm text-gray-400">Carregando…</p>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-primary">
                {client?.nome_fantasia || client?.razao_social}
              </h2>
              {client?.nome_fantasia && (
                <p className="text-sm text-gray-400">{client.razao_social}</p>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-accent hover:underline"
        >
          ← Trocar cliente
        </button>
      </div>

      {/* Métricas */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Produtos', value: items.length },
            { label: 'Preenchidos', value: preenchidos.length },
            { label: 'Venda ganha', value: ganhos.length, color: 'text-success' },
            { label: 'Conc. ganha', value: perdidos, color: 'text-danger' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center"
            >
              <p className={`text-2xl font-bold ${color ?? 'text-primary'}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cards de produto */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando produtos…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nenhum produto principal cadastrado. Adicione produtos abaixo.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ProductCard
              key={item.product.id}
              item={item}
              onUpdate={(patch) => updateItem(item.product.id, patch)}
              onRemove={() => removeItem(item.product.id)}
            />
          ))}
        </div>
      )}

      {/* Ações */}
      {!loading && (
        <div className="flex gap-3 flex-wrap pt-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 border border-accent text-accent text-sm rounded-md hover:bg-accent/5 transition-colors"
          >
            + Adicionar produto
          </button>
          <button
            onClick={handlePDF}
            disabled={items.length === 0}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Gerar PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando…' : 'Salvar pesquisa'}
          </button>
        </div>
      )}

      {showModal && (
        <ProductSearchModal
          addedIds={addedIds}
          onAdd={addProduct}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
