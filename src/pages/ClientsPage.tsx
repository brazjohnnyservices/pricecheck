import { useMemo, useState } from 'react'
import { useClients } from '@/hooks/useClients'
import ClientList from '@/components/ClientList'
import ClientFormModal from '@/components/ClientFormModal'
import type { Client } from '@/types/db'

export default function ClientsPage() {
  const { clients, loading, error, addClient, deleteClient } = useClients()
  const [busca, setBusca] = useState('')
  const [openCities, setOpenCities] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)

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

  const isOpen = (cidade: string) => busca.trim() !== '' || openCities.has(cidade)

  function toggleCity(cidade: string) {
    setOpenCities((prev) => {
      const next = new Set(prev)
      next.has(cidade) ? next.delete(cidade) : next.add(cidade)
      return next
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-2xl text-primary">Clientes</h2>
          <span className="text-sm text-gray-400">
            {loading ? '…' : `${filtrados.length} de ${clients.length}`}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome, bairro, cidade ou código…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {error && (
        <p className="text-sm text-danger">Erro ao carregar clientes: {error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando clientes…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nenhum cliente encontrado.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {grouped.map(([cidade, cidadeClients]) => {
            const open = isOpen(cidade)
            return (
              <section key={cidade}>
                <button
                  onClick={() => toggleCity(cidade)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{cidade}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {cidadeClients.length}
                    </span>
                  </div>
                  <span
                    className="text-gray-400 text-sm transition-transform duration-200"
                    style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}
                  >
                    ›
                  </span>
                </button>

                {open && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50/50">
                    <ClientList clients={cidadeClients} onDelete={deleteClient} />
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {showForm && (
        <ClientFormModal
          onSave={addClient}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
