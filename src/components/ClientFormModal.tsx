import { useState } from 'react'
import type { NewClient } from '@/types/db'

interface Props {
  onSave: (data: NewClient) => Promise<{ error: string | null }>
  onClose: () => void
}

const empty: NewClient = {
  codigo: 0,
  razao_social: '',
  nome_fantasia: null,
  endereco: null,
  numero: null,
  bairro: null,
  cidade: null,
  uf: null,
  telefone: null,
}

export default function ClientFormModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function set(field: keyof NewClient, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo || !form.razao_social.trim()) {
      setErro('Código e Razão Social são obrigatórios.')
      return
    }
    setSaving(true)
    setErro(null)
    const { error } = await onSave({ ...form, razao_social: form.razao_social.trim() })
    setSaving(false)
    if (error) {
      setErro(error.includes('unique') ? 'Já existe um cliente com esse código.' : error)
    } else {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-serif text-lg text-primary">Novo cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Código + Razão Social */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Código *</label>
              <input
                type="number"
                required
                value={form.codigo || ''}
                onChange={(e) => setForm((p) => ({ ...p, codigo: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-500">Razão Social *</label>
              <input
                type="text"
                required
                value={form.razao_social}
                onChange={(e) => setForm((p) => ({ ...p, razao_social: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Nome Fantasia */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Nome Fantasia</label>
            <input
              type="text"
              value={form.nome_fantasia ?? ''}
              onChange={(e) => set('nome_fantasia', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Cidade + UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-500">Cidade</label>
              <input
                type="text"
                value={form.cidade ?? ''}
                onChange={(e) => set('cidade', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">UF</label>
              <input
                type="text"
                maxLength={2}
                value={form.uf ?? ''}
                onChange={(e) => set('uf', e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent uppercase"
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Bairro</label>
            <input
              type="text"
              value={form.bairro ?? ''}
              onChange={(e) => set('bairro', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Endereço + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-gray-500">Endereço</label>
              <input
                type="text"
                value={form.endereco ?? ''}
                onChange={(e) => set('endereco', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Número</label>
              <input
                type="text"
                value={form.numero ?? ''}
                onChange={(e) => set('numero', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Telefone</label>
            <input
              type="tel"
              value={form.telefone ?? ''}
              onChange={(e) => set('telefone', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {erro && <p className="text-sm text-danger">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-accent text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar cliente'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
