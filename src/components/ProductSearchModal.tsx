import { useEffect, useRef, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types/db'

interface Props {
  addedIds: Set<number>
  onAdd: (product: Product) => void
  onClose: () => void
}

export default function ProductSearchModal({ addedIds, onAdd, onClose }: Props) {
  const { products, loading } = useProducts()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.toLowerCase().trim()
  const filtered = q
    ? products.filter(
        (p) =>
          p.descricao.toLowerCase().includes(q) ||
          String(p.codigo).includes(q)
      )
    : products

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-serif text-lg text-primary">Adicionar produto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Busca */}
        <div className="px-5 py-3">
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar por nome ou código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-5">
          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhum produto encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const added = addedIds.has(p.id)
                return (
                  <li key={p.id}>
                    <button
                      disabled={added}
                      onClick={() => onAdd(p)}
                      className={`w-full text-left px-2 py-3 flex items-center justify-between gap-3 rounded-lg transition-colors ${
                        added
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.descricao}</p>
                        <p className="text-xs text-gray-400">
                          Cód. {p.codigo}
                          {p.categoria ? ` · ${p.categoria}` : ''}
                        </p>
                      </div>
                      {added ? (
                        <span className="text-xs text-success font-medium whitespace-nowrap">✓ adicionado</span>
                      ) : (
                        <span className="text-accent text-lg leading-none font-medium">+</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Fechar */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
