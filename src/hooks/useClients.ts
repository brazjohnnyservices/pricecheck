import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Client, NewClient } from '@/types/db'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .order('nome_fantasia')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setClients(data ?? [])
        setLoading(false)
      })
  }, [])

  async function addClient(data: NewClient): Promise<{ error: string | null }> {
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(data)
      .select('*')
      .single()
    if (error) return { error: error.message }
    if (inserted) {
      setClients((prev) =>
        [...prev, inserted].sort((a, b) =>
          (a.nome_fantasia || a.razao_social).localeCompare(
            b.nome_fantasia || b.razao_social,
            'pt-BR'
          )
        )
      )
    }
    return { error: null }
  }

  async function deleteClient(id: number): Promise<{ error: string | null }> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) return { error: error.message }
    setClients((prev) => prev.filter((c) => c.id !== id))
    return { error: null }
  }

  return { clients, loading, error, addClient, deleteClient }
}
