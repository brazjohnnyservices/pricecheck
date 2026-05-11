import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '@/types/db'

interface Props {
  client: Client
  onDelete?: (id: number) => Promise<{ error: string | null }>
}

export default function ClientCard({ client, onDelete }: Props) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    await onDelete!(client.id)
    setDeleting(false)
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl group overflow-hidden">
      {/* Área principal — navega para pesquisa */}
      <button
        onClick={() => navigate(`/pesquisa/${client.id}`)}
        className="w-full text-left p-4 space-y-1 hover:border-accent transition-all duration-150"
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <p className="font-medium text-primary text-sm leading-tight group-hover:text-accent transition-colors">
            {client.nome_fantasia || client.razao_social}
          </p>
          <span className="text-xs text-gray-400 font-mono shrink-0">#{client.codigo}</span>
        </div>

        {client.nome_fantasia && (
          <p className="text-xs text-gray-500 truncate">{client.razao_social}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {client.bairro && (
            <span className="text-xs text-gray-400">{client.bairro}</span>
          )}
          {client.bairro && client.cidade && (
            <span className="text-xs text-gray-300">·</span>
          )}
          {client.cidade && (
            <span className="text-xs text-gray-400">
              {client.cidade}{client.uf ? ` — ${client.uf}` : ''}
            </span>
          )}
        </div>
      </button>

      {/* Botão excluir — visível no hover (desktop) e sempre no mobile */}
      {onDelete && !confirm && (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirm(true) }}
          className="absolute top-2 right-2 text-gray-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 text-lg leading-none p-1"
          aria-label="Excluir cliente"
        >
          ×
        </button>
      )}

      {/* Confirmação inline — cobre o card */}
      {confirm && (
        <div
          className="absolute inset-0 bg-white/96 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-gray-700 text-center px-4">
            Excluir <span className="text-primary">{client.nome_fantasia || client.razao_social}</span>?
          </p>
          <p className="text-xs text-gray-400 text-center px-4">
            Pesquisas desse cliente também serão apagadas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 bg-danger text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirm(false) }}
              className="px-4 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
