import ClientCard from './ClientCard'
import type { Client } from '@/types/db'

interface Props {
  clients: Client[]
  onDelete?: (id: number) => Promise<{ error: string | null }>
}

export default function ClientList({ clients, onDelete }: Props) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        Nenhum cliente encontrado.
      </p>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((c) => (
        <ClientCard key={c.id} client={c} onDelete={onDelete} />
      ))}
    </div>
  )
}
